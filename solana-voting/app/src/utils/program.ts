import { AnchorProvider, Program, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey("FoVqhkdSMVooKQm8t4XKX3Yg7LHjpe8CzZ962KzR5dsL");

export function getProgram(connection: Connection, wallet: WalletContextState) {
  // AnchorProvider expects a wallet with signTransaction; cast for typing.
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getPollPda(pollId: BN) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  )[0];
}

export function getVoterRecordPda(poll: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("voter"), poll.toBuffer(), voter.toBuffer()],
    PROGRAM_ID
  )[0];
}

export { SystemProgram, BN };
