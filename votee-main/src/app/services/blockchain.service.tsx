import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from '@solana/web3.js'
import idl from '../../../anchor/target/idl/votee.json'
import { Votee } from '../../../anchor/target/types/votee'
import { Candidate, Poll } from '../utils/interfaces'
import { store } from '../store'
import { globalActions } from '../store/globalSlices'

let tx
const programId = new PublicKey(idl.address)
const { setCandidates, setPoll } = globalActions
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8899'

export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: any,
  sendTransaction: any
): Program<Votee> | null => {
  if (!publicKey || !signTransaction) {
    console.error('Wallet not connected or missing signTransaction.')
    return null
  }

  const connection = new Connection(RPC_URL)
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: 'processed' }
  )

  return new Program<Votee>(idl as any, provider)
}

export const getReadonlyProvider = (): Program<Votee> => {
  const connection = new Connection(RPC_URL, 'confirmed')

  // Use a dummy wallet for read-only operations
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error('Read-only provider cannot sign transactions.')
    },
    signAllTransactions: async () => {
      throw new Error('Read-only provider cannot sign transactions.')
    },
  }

  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: 'processed',
  })

  return new Program<Votee>(idl as any, provider)
}

export const getCounter = async (program: Program<Votee>): Promise<BN> => {
  try {
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('counter')],
      program.programId
    )

    const counter = await program.account.counter.fetch(counterPDA)

    if (!counter) {
      console.warn('No counter found, returning zero')
      return new BN(0)
    }

    return counter.count
  } catch (error) {
    console.error('Failed to retrieve counter:', error)
    return new BN(-1)
  }
}

export const initialize = async (
  program: Program<Votee>,
  publicKey: PublicKey
): Promise<TransactionSignature> => {
  const [counterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter')],
    programId
  )
  const [registerationsPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('registerations')],
    programId
  )

  tx = await program.methods
    .initialize()
    .accountsPartial({
      user: publicKey,
      counter: counterPDA,
      registerations: registerationsPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )
  await connection.confirmTransaction(tx, 'finalized')

  return tx
}

export const createPoll = async (
  program: Program<Votee>,
  publicKey: PublicKey,
  nextCount: BN,
  description: string,
  start: number,
  end: number
): Promise<TransactionSignature> => {
  const [counterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter')],
    programId
  )
  const [pollPDA] = PublicKey.findProgramAddressSync(
    [nextCount.toArrayLike(Buffer, 'le', 8)],
    programId
  )

  const startBN = new BN(start)
  const endBN = new BN(end)

  tx = await program.methods
    .createPoll(description, startBN, endBN)
    .accountsPartial({
      user: publicKey,
      counter: counterPDA,
      poll: pollPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )
  await connection.confirmTransaction(tx, 'finalized')

  return tx
}

export const registerCandidate = async (
  program: Program<Votee>,
  publicKey: PublicKey,
  pollId: number,
  name: string
): Promise<TransactionSignature> => {
  const PID = new BN(pollId)
  const [pollPda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, 'le', 8)],
    programId
  )
  const [registerationsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('registerations')],
    programId
  )

  const regs = await program.account.registerations.fetch(registerationsPda)
  const CID = regs.count.add(new BN(1))

  const [candidatePda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, 'le', 8), CID.toArrayLike(Buffer, 'le', 8)],
    programId
  )

  tx = await program.methods
    .registerCandidate(PID, name)
    .accountsPartial({
      user: publicKey,
      poll: pollPda,
      registerations: registerationsPda,
      candidate: candidatePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )
  await connection.confirmTransaction(tx, 'finalized')

  return tx
}

export const vote = async (
  program: Program<Votee>,
  publicKey: PublicKey,
  pollId: number,
  candidateId: number
): Promise<TransactionSignature> => {
  const PID = new BN(pollId)
  const CID = new BN(candidateId)

  const [pollPda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, 'le', 8)],
    programId
  )
  const [voterPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('voter'),
      PID.toArrayLike(Buffer, 'le', 8),
      publicKey.toBuffer(),
    ],
    programId
  )
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, 'le', 8), CID.toArrayLike(Buffer, 'le', 8)],
    programId
  )

  tx = await program.methods
    .vote(PID, CID)
    .accountsPartial({
      user: publicKey,
      poll: pollPda,
      candidate: candidatePda,
      voter: voterPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )
  await connection.confirmTransaction(tx, 'finalized')

  return tx
}

export const fetchAllPolls = async (
  program: Program<Votee>
): Promise<Poll[]> => {
  const polls = await program.account.poll.all()
  return serializedPoll(polls)
}

export const fetchPollDetails = async (
  program: Program<Votee>,
  pollAddress: string
): Promise<Poll> => {
  const poll = await program.account.poll.fetch(pollAddress)

  const serialized: Poll = {
    ...poll,
    publicKey: pollAddress,
    id: poll.id.toNumber(),
    start: poll.start.toNumber() * 1000,
    end: poll.end.toNumber() * 1000,
    candidates: poll.candidates.toNumber(),
  }

  store.dispatch(setPoll(serialized))
  return serialized
}

const serializedPoll = (polls: any[]): Poll[] =>
  polls.map((c: any) => ({
    ...c.account,
    publicKey: c.publicKey.toBase58(),
    id: c.account.id.toNumber(),
    start: c.account.start.toNumber() * 1000,
    end: c.account.end.toNumber() * 1000,
    candidates: c.account.candidates.toNumber(),
  }))

export const fetchAllCandidates = async (
  program: Program<Votee>,
  pollAddress: string
): Promise<Candidate[]> => {
  const pollData = await fetchPollDetails(program, pollAddress)
  if (!pollData) return []

  const PID = new BN(pollData.id)

  const candidateAccounts = await program.account.candidate.all()
  const candidates = candidateAccounts.filter((candidate) => {
    // Assuming the candidate account has a field `pollId` or equivalent
    return candidate.account.pollId.eq(PID)
  })

  store.dispatch(setCandidates(serializedCandidates(candidates)))
  return candidates as unknown as Candidate[]
}

const serializedCandidates = (candidates: any[]): Candidate[] =>
  candidates.map((c: any) => ({
    ...c.account,
    publicKey: c.publicKey.toBase58(), // Convert to string
    cid: c.account.cid.toNumber(),
    pollId: c.account.pollId.toNumber(),
    votes: c.account.votes.toNumber(),
    name: c.account.name,
  }))

export const hasUserVoted = async (
  program: Program<Votee>,
  publicKey: PublicKey,
  pollId: number
): Promise<boolean> => {
  const PID = new BN(pollId)

  const [voterPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('voter'),
      PID.toArrayLike(Buffer, 'le', 8),
      publicKey.toBuffer(),
    ],
    programId
  )

  try {
    const voterAccount = await program.account.voter.fetch(voterPda)
    if (!voterAccount || !voterAccount.hasVoted) {
      return false // Default value if no account exists or hasn't voted
    }

    return true
  } catch (error) {
    console.error('Error fetching voter account:', error)
    return false
  }
}
