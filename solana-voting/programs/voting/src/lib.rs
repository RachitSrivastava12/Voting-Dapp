use anchor_lang::prelude::*;

declare_id!("FoVqhkdSMVooKQm8t4XKX3Yg7LHjpe8CzZ962KzR5dsL");

#[program]
pub mod voting {
    use super::*;

    // Create a new poll. Anyone can create one.
    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: u64,
        title: String,
        description: String,
        options: Vec<String>,
        end_time: i64,
    ) -> Result<()> {
        require!(title.len() <= 100, VotingError::TitleTooLong);
        require!(description.len() <= 280, VotingError::DescriptionTooLong);
        require!(options.len() >= 2 && options.len() <= 5, VotingError::InvalidOptionCount);
        require!(end_time > Clock::get()?.unix_timestamp, VotingError::InvalidEndTime);

        let poll = &mut ctx.accounts.poll;
        poll.id = poll_id;
        poll.creator = ctx.accounts.creator.key();
        poll.title = title;
        poll.description = description;
        poll.options = options.iter().map(|name| PollOption {
            name: name.clone(),
            votes: 0,
        }).collect();
        poll.end_time = end_time;
        poll.bump = ctx.bumps.poll;
        Ok(())
    }

    // Cast a vote. PDA enforces one vote per wallet per poll.
    pub fn vote(ctx: Context<Vote>, option_index: u8) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let now = Clock::get()?.unix_timestamp;

        require!(now < poll.end_time, VotingError::PollEnded);
        require!((option_index as usize) < poll.options.len(), VotingError::InvalidOption);

        poll.options[option_index as usize].votes += 1;

        let voter_record = &mut ctx.accounts.voter_record;
        voter_record.voter = ctx.accounts.voter.key();
        voter_record.poll = poll.key();
        voter_record.option_index = option_index;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = creator,
        space = Poll::SPACE,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = voter,
        space = VoterRecord::SPACE,
        seeds = [b"voter", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub voter_record: Account<'info, VoterRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Poll {
    pub id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub options: Vec<PollOption>,
    pub end_time: i64,
    pub bump: u8,
}

impl Poll {
    // discriminator + id + creator + title(4+100) + desc(4+280) + options(4 + 5*(4+50+8)) + end_time + bump
    pub const SPACE: usize = 8 + 8 + 32 + (4 + 100) + (4 + 280) + (4 + 5 * (4 + 50 + 8)) + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PollOption {
    pub name: String,
    pub votes: u64,
}

#[account]
pub struct VoterRecord {
    pub voter: Pubkey,
    pub poll: Pubkey,
    pub option_index: u8,
}

impl VoterRecord {
    pub const SPACE: usize = 8 + 32 + 32 + 1;
}

#[error_code]
pub enum VotingError {
    #[msg("Title must be 100 characters or fewer")]
    TitleTooLong,
    #[msg("Description must be 280 characters or fewer")]
    DescriptionTooLong,
    #[msg("Poll must have between 2 and 5 options")]
    InvalidOptionCount,
    #[msg("End time must be in the future")]
    InvalidEndTime,
    #[msg("Poll has already ended")]
    PollEnded,
    #[msg("Invalid option index")]
    InvalidOption,
}
