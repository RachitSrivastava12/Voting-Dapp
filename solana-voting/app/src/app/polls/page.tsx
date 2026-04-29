"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { getProgram, BN } from "@/utils/program";
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

export default function PollsList() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");

  const fetchPolls = useCallback(async () => {
    if (!wallet.publicKey) {
      setLoading(false);
      return;
    }
    try {
      const program = getProgram(connection, wallet);
      const accounts = await (program.account as any).poll.all();
      const sorted = accounts.sort((a: any, b: any) => b.account.id.cmp(a.account.id));
      setPolls(sorted.map((a: any) => ({ publicKey: a.publicKey, ...a.account })));
    } catch (err) {
      console.error("fetchPolls error:", err);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const now = Date.now();
  const activeCount = polls.filter((p) => p.endTime.toNumber() * 1000 >= now).length;
  const endedCount = polls.filter((p) => p.endTime.toNumber() * 1000 < now).length;
  const totalVotes = polls.reduce(
    (sum, p) => sum + p.options.reduce((s, o) => s + o.votes.toNumber(), 0),
    0
  );

  const filtered = polls.filter((p) => {
    const ended = p.endTime.toNumber() * 1000 < now;
    if (filter === "active") return !ended;
    if (filter === "ended") return ended;
    return true;
  });

  return (
    <main className="min-h-screen bg-app text-app">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8 flex items-end justify-between border-b border-app pb-6">
          <div>
            <div className="data mb-1.5 text-sm uppercase tracking-[0.2em] text-app-faint">
              Solana Devnet · {polls.length} polls indexed
            </div>
            <h1 className="text-3xl font-bold text-app">All Polls</h1>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-3 data text-sm uppercase tracking-[0.15em] text-[color:var(--cyan)] transition-all [border-color:color-mix(in_srgb,var(--cyan)_28%,transparent)] hover:bg-[color:var(--accent-soft)] hover:[border-color:color-mix(in_srgb,var(--cyan)_50%,transparent)]"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New Poll
          </Link>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-44 shrink-0 hidden lg:block">
            <div className="data mb-3 text-sm uppercase tracking-[0.2em] text-app-faint">Filter</div>
            <div className="space-y-px">
              {([
                { key: "all", label: "All", count: polls.length },
                { key: "active", label: "Active", count: activeCount },
                { key: "ended", label: "Ended", count: endedCount },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-left transition-all ${
                    filter === key
                      ? "bg-[color:var(--accent-soft)] text-[color:var(--cyan)]"
                      : "text-app-muted hover:bg-[color:var(--surface-hover)] hover:text-app"
                  }`}
                >
                  <span className="data text-sm uppercase tracking-widest">{label}</span>
                  <span className="data text-sm text-app-faint">{count}</span>
                </button>
              ))}
            </div>

            {/* Stats summary */}
            {polls.length > 0 && (
              <div className="mt-8 space-y-4 rounded-xl border border-app bg-app-surface p-5 shadow-[var(--shadow-soft)]">
                <div className="data text-sm uppercase tracking-[0.2em] text-app-faint">Summary</div>
                {[
                  { label: "Total votes", value: totalVotes.toLocaleString() },
                  { label: "Active", value: activeCount },
                  { label: "Ended", value: endedCount },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="data text-sm uppercase tracking-widest text-app-faint">{label}</div>
                    <div className="data mt-0.5 text-2xl font-bold text-app">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main list */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter */}
            <div className="flex gap-1 mb-4 lg:hidden">
              {(["all", "active", "ended"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-4 py-2 data text-sm uppercase tracking-widest transition ${
                    filter === f
                      ? "bg-[color:var(--accent-soft)] text-[color:var(--cyan)]"
                      : "bg-app-surface text-app-muted hover:text-app"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {!wallet.publicKey ? (
              <EmptyState
                title="Wallet not connected"
                desc="Connect your Solana wallet on Devnet to browse polls"
              />
            ) : loading ? (
              <LoadingState />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={filter === "all" ? "No polls yet" : `No ${filter} polls`}
                desc={filter === "all" ? "Be the first to create one" : undefined}
                cta={filter === "all" ? { label: "Create poll", href: "/create" } : undefined}
              />
            ) : (
              <div className="space-y-px">
                {/* Column headers */}
                <div className="flex items-center gap-4 border-b border-app px-4 pb-3">
                  <div className="w-2 shrink-0" />
                  <div className="flex-1 data text-sm uppercase tracking-widest text-app-faint">Poll</div>
                  <div className="hidden w-36 data text-sm uppercase tracking-widest text-app-faint text-right md:block">
                    Votes
                  </div>
                  <div className="w-24 data text-sm uppercase tracking-widest text-app-faint text-right">
                    Expires
                  </div>
                </div>

                {filtered.map((poll, i) => (
                  <PollRow key={poll.publicKey.toString()} poll={poll} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PollRow({ poll, index }: { poll: Poll; index: number }) {
  const now = Date.now();
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.toNumber(), 0);
  const ended = poll.endTime.toNumber() * 1000 < now;
  const timeMs = poll.endTime.toNumber() * 1000 - now;
  const daysLeft = Math.floor(timeMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const maxVotes = Math.max(...poll.options.map((o) => o.votes.toNumber()), 0);
  const leadPct = totalVotes > 0 ? (maxVotes / totalVotes) * 100 : 0;

  return (
    <Link
      href={`/poll/${poll.publicKey.toString()}`}
      className="group flex items-center gap-4 border-b border-app px-4 py-4 transition-all hover:bg-[color:var(--accent-soft)]"
    >
      {/* Status indicator */}
      <div className="shrink-0 w-2 flex justify-center">
        {ended ? (
          <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--text-faint)]" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--green)] animate-pulse" />
        )}
      </div>

      {/* Title + desc */}
      <div className="flex-1 min-w-0">
        <div className="truncate text-lg font-medium text-app-secondary transition-colors group-hover:text-app">
          {poll.title}
        </div>
        {poll.description && (
          <div className="data mt-1 truncate text-sm text-app-faint">{poll.description}</div>
        )}
        <div className="flex items-center gap-2 mt-1.5 md:hidden">
          <span className="data text-sm text-app-faint">{totalVotes} votes</span>
          {ended ? (
            <span className="data text-sm uppercase tracking-widest text-app-faint">Ended</span>
          ) : (
            <span className="data text-sm text-[color:var(--cyan)]">
              {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`}
            </span>
          )}
        </div>
      </div>

      {/* Vote bar */}
      <div className="hidden md:flex items-center gap-3 w-36 shrink-0">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--border)]">
          {totalVotes > 0 && (
            <div
              className="h-full bg-[color:var(--cyan)] transition-all"
              style={{ width: `${leadPct}%` }}
            />
          )}
        </div>
        <span className="data w-16 text-right text-sm text-app-faint">
          {totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"}
        </span>
      </div>

      {/* Time */}
      <div className="shrink-0 w-20 text-right">
        {ended ? (
          <span className="data text-sm uppercase tracking-widest text-app-faint">Ended</span>
        ) : (
          <span className="data text-sm text-[color:var(--cyan)]">
            {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`}
          </span>
        )}
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-app px-4 py-4">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--border)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/5 rounded bg-[color:var(--surface-hover)] shimmer" />
            <div className="h-3 w-2/5 rounded bg-[color:var(--surface-hover)] shimmer" />
          </div>
          <div className="h-3 w-20 rounded bg-[color:var(--surface-hover)] shimmer" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  desc,
  cta,
}: {
  title: string;
  desc?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="rounded-xl border border-app bg-app-surface py-20 text-center shadow-[var(--shadow-soft)]">
      <div className="data mb-4 text-sm uppercase tracking-[0.25em] text-app-faint">// empty</div>
      <h3 className="mb-2 text-lg font-medium text-app-secondary">{title}</h3>
      {desc && <p className="data mb-8 text-sm text-app-faint">{desc}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 rounded-md border px-5 py-3 data text-sm uppercase tracking-[0.15em] text-[color:var(--cyan)] transition-all [border-color:color-mix(in_srgb,var(--cyan)_28%,transparent)] hover:bg-[color:var(--accent-soft)]"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
