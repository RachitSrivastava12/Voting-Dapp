"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import {
  getExplorerUrl,
  getProgram,
  getVoterRecordPda,
  MEMO_PROGRAM_ID,
  SystemProgram,
  BN,
} from "@/utils/program";
import { PublicKey } from "@solana/web3.js";

type Poll = {
  publicKey: PublicKey;
  id: BN;
  creator: PublicKey;
  title: string;
  description: string;
  options: { name: string; votes: BN }[];
  endTime: BN;
};

export default function PollDetail() {
  const params = useParams();
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [myChoice, setMyChoice] = useState<number | null>(null);
  const [lastVoteSignature, setLastVoteSignature] = useState<string | null>(null);

  const pollId = params.id as string;

  const fetchPoll = useCallback(async () => {
    if (!wallet.publicKey || !pollId) return;
    try {
      const program = getProgram(connection, wallet);
      const pollPubkey = new PublicKey(pollId);
      const account: any = await (program.account as any).poll.fetch(pollPubkey);
      setPoll({ publicKey: pollPubkey, ...account });

      const voterRecordPda = getVoterRecordPda(pollPubkey, wallet.publicKey);
      try {
        const record: any = await (program.account as any).voterRecord.fetch(voterRecordPda);
        setHasVoted(true);
        setMyChoice(record.optionIndex);
      } catch {
        setHasVoted(false);
        setMyChoice(null);
      }
    } catch (err) {
      console.error("fetchPoll error:", err);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  async function castVote(optionIndex: number) {
    if (!wallet.publicKey || !poll) return;
    setVoting(true);
    setLastVoteSignature(null);
    try {
      const program = getProgram(connection, wallet);
      const voterRecordPda = getVoterRecordPda(poll.publicKey, wallet.publicKey);

      const signature = await program.methods
        .vote(optionIndex)
        .accounts({
          poll: poll.publicKey,
          voterRecord: voterRecordPda,
          voter: wallet.publicKey,
          memoProgram: MEMO_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setLastVoteSignature(signature);
      await fetchPoll();
    } catch (err: any) {
      console.error(err);
      const msg = err.message?.includes("already in use")
        ? "You've already voted on this poll."
        : err.message ?? String(err);
      alert("Error: " + msg);
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-app text-app">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 text-app-faint">
            <div className="h-4 w-4 animate-spin rounded-full border border-app border-t-[color:var(--cyan)]" />
            <span className="data text-base uppercase tracking-widest">Fetching poll...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!poll) {
    return (
      <main className="min-h-screen bg-app text-app">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="data mb-4 text-sm uppercase tracking-[0.25em] text-app-faint">// 404</div>
          <p className="mb-6 text-base text-app-secondary">Poll not found or has been removed</p>
          <button
            onClick={() => router.push("/polls")}
            className="inline-flex items-center gap-2 rounded-md border border-app px-5 py-3 data text-sm uppercase tracking-[0.15em] text-app-secondary transition-all hover:bg-[color:var(--surface-hover)] hover:text-app"
          >
            ← All polls
          </button>
        </div>
      </main>
    );
  }

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.toNumber(), 0);
  const ended = poll.endTime.toNumber() * 1000 < Date.now();
  const isCreator = wallet.publicKey?.equals(poll.creator);
  const voterRecordPda = wallet.publicKey
    ? getVoterRecordPda(poll.publicKey, wallet.publicKey)
    : null;
  const timeMs = poll.endTime.toNumber() * 1000 - Date.now();
  const daysLeft = Math.floor(timeMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const winnerIdx = poll.options.reduce(
    (maxIdx, o, i, arr) =>
      o.votes.toNumber() > arr[maxIdx].votes.toNumber() ? i : maxIdx,
    0
  );

  return (
    <main className="min-h-screen bg-app text-app">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <button
          onClick={() => router.push("/polls")}
          className="mb-8 inline-flex items-center gap-2 data text-sm uppercase tracking-[0.15em] text-app-faint transition-colors hover:text-app"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All polls
        </button>

        {/* Main layout: two columns */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Left — metadata panel */}
          <aside className="space-y-4">
            {/* Status card */}
            <div className="rounded-xl border border-app bg-app-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between mb-4">
                <div className="data text-sm uppercase tracking-[0.2em] text-app-faint">Status</div>
                {ended ? (
                  <div className="flex items-center gap-1.5 rounded-md border border-app px-2.5 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--text-faint)]" />
                    <span className="data text-sm uppercase tracking-widest text-app-faint">Ended</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 [border-color:color-mix(in_srgb,var(--green)_25%,transparent)] bg-[color:var(--success-soft)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--green)] animate-pulse" />
                    <span className="data text-sm uppercase tracking-widest text-[color:var(--green)]">Active</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Total votes",
                    value: totalVotes.toLocaleString(),
                    accent: "text-app",
                  },
                  {
                    label: "Options",
                    value: poll.options.length,
                    accent: "text-app-secondary",
                  },
                  {
                    label: ended ? "Ended" : "Closes",
                    value: new Date(poll.endTime.toNumber() * 1000).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                    accent: "text-app-secondary",
                  },
                  ...(!ended
                    ? [
                        {
                          label: "Time left",
                          value: daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`,
                          accent: "text-[color:var(--cyan)]",
                        },
                      ]
                    : []),
                ].map(({ label, value, accent }) => (
                  <div key={label} className="flex items-center justify-between border-b border-app pb-3 last:border-0 last:pb-0">
                    <span className="data text-sm uppercase tracking-widest text-app-faint">{label}</span>
                    <span className={`data text-base font-medium ${accent}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Creator */}
            <div className="rounded-xl border border-app bg-app-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="data mb-3 text-sm uppercase tracking-[0.2em] text-app-faint">Creator</div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-app bg-app-elevated">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="3.5" r="2" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1"/>
                    <path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
                <code className="data text-sm tracking-wider text-app-secondary">
                  {poll.creator.toString().slice(0, 6)}...{poll.creator.toString().slice(-6)}
                  {isCreator && <span className="ml-1 text-[color:var(--cyan)]">(you)</span>}
                </code>
              </div>
            </div>

            {/* On-chain address */}
            <div className="rounded-xl border border-app bg-app-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="data mb-3 text-sm uppercase tracking-[0.2em] text-app-faint">Program account</div>
              <a
                href={getExplorerUrl(`address/${poll.publicKey.toString()}`)}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <code className="data break-all text-sm leading-relaxed tracking-wider text-app-secondary transition-colors hover:text-app">
                  {poll.publicKey.toString()}
                </code>
              </a>
            </div>

            {/* Voted banner */}
            {hasVoted && (
              <div className="rounded-xl border p-4 [border-color:color-mix(in_srgb,var(--green)_25%,transparent)] bg-[color:var(--success-soft)]">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="data text-sm uppercase tracking-widest text-[color:var(--green)]">Vote recorded</span>
                </div>
                <p className="data mt-1 text-sm text-app-secondary">
                  You voted for{" "}
                  <span className="font-medium text-app">
                    {poll.options[myChoice!]?.name}
                  </span>
                </p>
                {voterRecordPda && (
                  <a
                    href={getExplorerUrl(`address/${voterRecordPda.toString()}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="data mt-3 inline-flex text-sm uppercase tracking-widest text-[color:var(--green)] transition-opacity hover:opacity-80"
                  >
                    Open voter record on Explorer ↗
                  </a>
                )}
                {lastVoteSignature && (
                  <a
                    href={getExplorerUrl(`tx/${lastVoteSignature}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="data mt-2 inline-flex text-sm uppercase tracking-widest text-[color:var(--green)] transition-opacity hover:opacity-80"
                  >
                    Open vote transaction memo ↗
                  </a>
                )}
              </div>
            )}
          </aside>

          {/* Right — voting panel */}
          <div>
            {/* Poll title */}
            <div className="mb-6 border-b border-app pb-6">
              <h1 className="mb-3 text-3xl font-bold leading-tight text-app md:text-4xl">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="max-w-2xl text-lg leading-relaxed text-app-secondary">{poll.description}</p>
              )}
            </div>

            {/* Results header */}
            <div className="data mb-4 text-sm uppercase tracking-[0.2em] text-app-faint">
              {ended ? "Final results" : "Live results · click to vote"}
            </div>

            {/* Options */}
            <div className="space-y-2">
              {poll.options.map((opt, i) => {
                const votes = opt.votes.toNumber();
                const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                const isMyChoice = myChoice === i;
                const isWinner = ended && i === winnerIdx && totalVotes > 0;
                const canVote = !hasVoted && !ended && wallet.publicKey;

                return (
                  <button
                    key={i}
                    onClick={() => canVote && castVote(i)}
                    disabled={!canVote || voting}
                    className={`w-full text-left relative overflow-hidden border transition-all ${
                      isMyChoice
                        ? "border-[color:color-mix(in_srgb,var(--cyan)_40%,transparent)] bg-[color:var(--accent-soft)]"
                        : isWinner
                        ? "border-[color:color-mix(in_srgb,var(--green)_30%,transparent)] bg-[color:var(--success-soft)]"
                        : canVote
                        ? "border-app bg-app-surface hover:border-[color:color-mix(in_srgb,var(--cyan)_25%,transparent)] hover:bg-[color:var(--surface-hover)] cursor-pointer"
                        : "border-app bg-app-surface cursor-default"
                    }`}
                  >
                    {/* Vote fill bar */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                        isMyChoice
                          ? "bg-[color:var(--accent-soft)]"
                          : isWinner
                          ? "bg-[color:var(--success-soft)]"
                          : "bg-[color:var(--surface-hover)]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />

                    <div className="relative flex items-center gap-4 px-5 py-4">
                      {/* Option letter */}
                      <div
                        className={`w-7 h-7 border flex items-center justify-center shrink-0 ${
                          isMyChoice
                            ? "border-[color:color-mix(in_srgb,var(--cyan)_40%,transparent)] bg-[color:var(--accent-soft)]"
                            : isWinner
                            ? "border-[color:color-mix(in_srgb,var(--green)_30%,transparent)] bg-[color:var(--success-soft)]"
                            : "border-app bg-app-elevated"
                        }`}
                      >
                        {isMyChoice ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#00d4ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : isWinner ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <span className="data text-sm font-bold text-app-faint">
                            {String.fromCharCode(65 + i)}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <span
                        className={`flex-1 text-lg font-medium ${
                          isMyChoice
                            ? "text-[color:var(--cyan)]"
                            : isWinner
                            ? "text-[color:var(--green)]"
                            : "text-app-secondary"
                        }`}
                      >
                        {opt.name}
                      </span>

                      {/* Stats */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div
                            className={`data text-base font-bold ${
                              isMyChoice
                                ? "text-[color:var(--cyan)]"
                                : isWinner
                                ? "text-[color:var(--green)]"
                                : "text-app-secondary"
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </div>
                          <div className="data text-sm text-app-faint">{votes} votes</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom progress line */}
                    <div className="relative h-1 bg-[color:var(--border)]">
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                          isMyChoice ? "bg-[color:var(--cyan)]" : isWinner ? "bg-[color:var(--green)]" : "bg-app-elevated"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Voting states */}
            <div className="mt-5">
              {!wallet.publicKey && (
                <div className="rounded-xl border border-app bg-app-surface p-4 text-center">
                  <p className="data text-sm uppercase tracking-widest text-app-faint">
                    // Connect wallet to vote
                  </p>
                </div>
              )}
              {voting && (
                <div className="flex items-center justify-center gap-3 rounded-xl border py-4 [border-color:color-mix(in_srgb,var(--cyan)_20%,transparent)] bg-[color:var(--accent-soft)]">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-[color:color-mix(in_srgb,var(--cyan)_30%,transparent)] border-t-[color:var(--cyan)]" />
                  <span className="data text-sm uppercase tracking-widest text-[color:var(--cyan)]">
                    Submitting vote on-chain...
                  </span>
                </div>
              )}
              {ended && totalVotes > 0 && !voting && (
                <div className="rounded-xl border border-app bg-app-surface p-4 text-center">
                  <p className="data text-sm uppercase tracking-widest text-app-faint">
                    // Poll closed · Final tally recorded on-chain
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}   
