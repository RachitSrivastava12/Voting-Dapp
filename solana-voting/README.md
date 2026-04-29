# Solana Voting dApp ⚡

Decentralized voting on Solana. Anchor program + Next.js frontend.

## What it does
- Anyone with a wallet can create a poll (2-5 options, custom duration)
- One vote per wallet per poll (enforced by PDA, init constraint blocks doubles)
- Live results with vote bars
- Devnet by default

## Prerequisites (install once)

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Anchor via avm
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Node
# Use nvm or your installer of choice; Node 18+
```

## Step-by-step (the speedrun)

### 1. Configure Solana for devnet & fund wallet

```bash
solana config set --url devnet
solana-keygen new                  # if you don't have a keypair
solana airdrop 2                   # if rate-limited, use https://faucet.solana.com
solana address                     # note this
```

### 2. Sync the program ID

The placeholder `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` must be replaced with YOUR program's keypair address.

```bash
cd solana-voting
anchor build
solana address -k target/deploy/voting-keypair.json
```

Copy that address. Replace `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` in **3 places**:
- `programs/voting/src/lib.rs` → `declare_id!("...")`
- `Anchor.toml` → both `[programs.localnet]` and `[programs.devnet]`
- `app/src/utils/program.ts` → `PROGRAM_ID`

Then rebuild:

```bash
anchor build
```

### 3. Deploy to devnet

```bash
anchor deploy --provider.cluster devnet
```

If deploy fails with insufficient SOL, airdrop more or use the web faucet.

### 4. Copy the IDL to the frontend

```bash
cp target/idl/voting.json app/src/utils/idl.json
```

### 5. Run the frontend

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

### 6. Use it

1. Switch your Phantom wallet to **Devnet** (Settings → Developer Settings → Testnet Mode)
2. Click "Select Wallet", connect Phantom
3. Create a poll, vote, share with friends — they need devnet SOL too

## Architecture

```
Anchor program
├── create_poll(id, title, desc, options, end_time)
│   └── Poll PDA: seeds = ["poll", id]
└── vote(option_index)
    └── VoterRecord PDA: seeds = ["voter", poll, voter]
        └── init constraint = automatic one-vote-per-wallet
```

### Why PDA-based vote tracking?

Each vote creates a `VoterRecord` PDA seeded by `(poll, voter)`. Anchor's `init` will fail if the account already exists — meaning the SAME wallet cannot vote twice on the same poll. No extra logic needed; it's enforced by the runtime.

## Files

- `programs/voting/src/lib.rs` — the smart contract
- `app/src/app/page.tsx` — main UI (create + list + vote)
- `app/src/utils/program.ts` — Anchor client + PDA helpers
- `app/src/components/WalletContextProvider.tsx` — wallet adapter setup

## Common issues

- **"Account does not exist"** when fetching polls → IDL is stale, recopy `target/idl/voting.json`
- **"already in use"** on vote → that wallet already voted (working as intended)
- **Deploy fails** → check `solana balance`, get more devnet SOL
- **Wallet shows mainnet balance** → switch Phantom to Devnet in settings
- **declare_id mismatch error** at runtime → you forgot to replace the program ID in one of the 3 files

## Extending

- Add a `close_poll` instruction to refund rent to the creator after end_time
- Store voter's chosen option in `VoterRecord` (already in schema) and show "you voted X"
- Add weighted voting using SPL token balance snapshots
- Index events with Helius/Shyft for a leaderboard
