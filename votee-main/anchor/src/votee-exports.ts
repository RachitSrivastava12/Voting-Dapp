// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import VoteeIDL from '../target/idl/votee.json'
import type { Votee } from '../target/types/votee'

// Re-export the generated IDL and type
export { Votee, VoteeIDL }

// The programId is imported from the program IDL.
export const VOTEE_PROGRAM_ID = new PublicKey(VoteeIDL.address)

// This is a helper function to get the Votee Anchor program.
export function getVoteeProgram(provider: AnchorProvider) {
  return new Program(VoteeIDL as Votee, provider)
}

// This is a helper function to get the program ID for the Votee program depending on the cluster.
export function getVoteeProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Votee program on devnet and testnet.
      return new PublicKey('CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg')
    case 'mainnet-beta':
    default:
      return VOTEE_PROGRAM_ID
  }
}
