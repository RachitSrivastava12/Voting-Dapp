"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-app text-app">
      {/* Status ticker */}
      <div className="flex h-10 shrink-0 items-center overflow-hidden border-b border-app bg-app">
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-app px-4">
          <div className="relative w-1.5 h-1.5">
            <div className="absolute inset-0 rounded-full bg-[color:var(--green)]" />
            <div className="absolute inset-0 rounded-full bg-[color:var(--green)] animate-ping opacity-75" />
          </div>
          <span className="data text-sm uppercase tracking-[0.2em] text-[color:var(--green)]">Live</span>
        </div>
        <div className="flex items-center gap-10 px-6">
          {[
            "Cluster: Solana Devnet",
            "Consensus: Proof of History",
            "Vote Cost: ~0.000005 SOL",
            "Finality: <400ms",
            "Double Vote: Impossible via PDA",
          ].map((item) => (
            <span key={item} className="data shrink-0 text-sm uppercase tracking-[0.12em] text-app-faint">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="flex h-16 items-center border-b border-app px-6 md:px-12">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-6 w-6 items-center justify-center border transition-colors [border-color:color-mix(in_srgb,var(--cyan)_40%,transparent)] group-hover:[border-color:color-mix(in_srgb,var(--cyan)_75%,transparent)]">
              <div className="h-2.5 w-2.5 bg-[color:var(--cyan)]" />
            </div>
            <span className="data text-sm font-semibold uppercase tracking-[0.18em] text-app-secondary transition-colors group-hover:text-app">
              SolanaVote
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {[
              { href: "/polls", label: "Browse" },
              { href: "/create", label: "Create" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="data text-sm uppercase tracking-[0.15em] text-app-muted transition hover:text-app"
              >
                {label}
              </Link>
            ))}
            <ThemeToggle />
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-line-grid overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-1/3 h-[500px] w-[800px] rounded-full bg-[color:var(--accent-soft)] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-[color:color-mix(in_srgb,var(--elevated)_85%,var(--cyan)_15%)] blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 grid lg:grid-cols-[1fr_360px] gap-16 items-start">
          {/* Left — headline */}
          <div>
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-md border px-3 py-2 [border-color:color-mix(in_srgb,var(--cyan)_25%,transparent)] bg-[color:var(--accent-soft)]">
              <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--green)] animate-pulse" />
              <span className="data text-sm uppercase tracking-[0.2em] text-[color:var(--cyan)]">
                On-chain · Transparent · Verifiable
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tighter mb-8">
              <span className="text-app">Decentralized</span>
              <br />
              <span className="text-[color:var(--cyan)]">voting</span>
              <br />
              <span className="text-app-muted">on Solana.</span>
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-app-secondary">
              Every vote is a signed on-chain transaction. Results are public,
              immutable, and independently verifiable — no server, no database,
              no middlemen.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--cyan)] px-6 py-3 text-base font-bold tracking-wide text-slate-950 transition-colors hover:brightness-110"
              >
                Create a poll
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                href="/polls"
                className="inline-flex items-center gap-2 rounded-md border border-app px-6 py-3 text-base text-app-secondary transition-all hover:bg-[color:var(--surface-hover)] hover:text-app"
              >
                Browse polls
              </Link>
            </div>

            {!connected && (
              <p className="data text-sm tracking-widest text-app-faint">
                // Phantom · Backpack · Solflare · any Wallet Standard wallet
              </p>
            )}
          </div>

          {/* Right — terminal panel */}
          <div className="overflow-hidden rounded-xl border border-app bg-app-surface shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2.5 border-b border-app bg-app-elevated px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full border border-app bg-app" />
                <div className="h-2.5 w-2.5 rounded-full border border-app bg-app" />
                <div className="h-2.5 w-2.5 rounded-full border border-app bg-app" />
              </div>
              <span className="data ml-1 text-sm tracking-widest text-app-faint">network_info.ts</span>
            </div>
            <div className="p-5">
              <div className="data mb-4 text-sm tracking-widest text-app-faint">
                <span className="text-app-muted">const</span>{" "}
                <span className="text-[color:var(--cyan)]">network</span>{" "}
                <span className="text-app-faint">= {"{"}</span>
              </div>
              <div className="space-y-2.5 pl-4">
                {[
                  { k: "cluster", v: '"devnet"', c: "text-[color:var(--green)]" },
                  { k: "consensus", v: '"proof_of_history"', c: "text-app-secondary" },
                  { k: "doubleVote", v: "impossible", c: "text-[color:var(--green)]" },
                  { k: "voteCost", v: '"~0.000005 SOL"', c: "text-app-secondary" },
                  { k: "finality", v: '"<400ms"', c: "text-[color:var(--green)]" },
                  { k: "middlemen", v: "0", c: "text-[color:var(--cyan)]" },
                  { k: "trust", v: "false", c: "text-[color:var(--cyan)]" },
                ].map(({ k, v, c }) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="data w-24 shrink-0 text-base text-app-muted">{k}:</span>
                    <span className={`data text-base ${c}`}>{v},</span>
                  </div>
                ))}
              </div>
              <div className="data mt-3 text-sm text-app-faint">{"}"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-app bg-app-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid divide-y divide-app md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              {
                idx: "01",
                title: "On-chain integrity",
                body: "Every vote is a Solana transaction. Stored on-chain permanently — immutable, auditable, and verifiable by anyone with an RPC connection.",
                accent: "text-[color:var(--cyan)]",
              },
              {
                idx: "02",
                title: "PDA-enforced single vote",
                body: "A Program Derived Address per wallet prevents double-voting at the smart contract level, not the UI layer. The protocol itself enforces the rule.",
                accent: "text-[color:var(--green)]",
              },
              {
                idx: "03",
                title: "Sub-cent finality",
                body: "Solana's PoH consensus finalizes votes in under 400ms for fractions of a cent. Real-time results — no polling, no caching tricks.",
                accent: "text-app-secondary",
              },
            ].map(({ idx, title, body, accent }) => (
              <div key={idx} className="px-8 py-10 group">
                <div className={`data mb-4 text-sm font-bold tracking-widest ${accent}`}>{idx}</div>
                <h3 className="mb-3 text-lg font-semibold text-app">{title}</h3>
                <p className="text-base leading-relaxed text-app-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="data mb-2 text-sm uppercase tracking-[0.25em] text-app-faint">Process</div>
        <h2 className="mb-16 text-3xl font-bold text-app">Three steps to trustless voting</h2>
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line */}
          <div className="absolute left-12 right-12 top-5 hidden h-px bg-[color:var(--border)] md:block" />
          {[
            {
              n: "01",
              title: "Connect wallet",
              body: "Connect any Wallet Standard wallet (Phantom, Backpack, Solflare) on Devnet. No sign-up, no email.",
            },
            {
              n: "02",
              title: "Create or vote",
              body: "Deploy a poll with up to 5 options — it lives on-chain as a program account. Vote on any active poll with a single transaction.",
            },
            {
              n: "03",
              title: "Verify results",
              body: "Vote tallies update on-chain in real time. Anyone can verify the outcome by reading program accounts directly via any Solana RPC.",
            },
          ].map(({ n, title, body }) => (
            <div key={n} className="relative pl-0">
              <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-app bg-app">
                <span className="data text-base font-bold text-[color:var(--cyan)]">{n}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-app">{title}</h3>
              <p className="text-base leading-relaxed text-app-secondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-y border-app bg-app-surface">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="mb-1.5 text-2xl font-bold text-app">Ready to vote on-chain?</h2>
            <p className="text-base text-app-secondary">Create your first poll in under a minute. No account required.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/create"
              className="rounded-md bg-[color:var(--cyan)] px-6 py-3 text-base font-bold text-slate-950 transition-colors hover:brightness-110"
            >
              Create a poll →
            </Link>
            <Link
              href="/polls"
              className="rounded-md border border-app px-6 py-3 text-base text-app-secondary transition-all hover:bg-[color:var(--surface-hover)] hover:text-app"
            >
              Browse polls
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between gap-4">
          <span className="data text-sm uppercase tracking-[0.2em] text-app-faint">
            SolanaVote · Solana Devnet · Open Source
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--green)] animate-pulse" />
            <span className="data text-sm uppercase tracking-[0.15em] text-[color:var(--green)]">Network live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
