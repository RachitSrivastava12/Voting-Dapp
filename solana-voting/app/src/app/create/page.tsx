"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BN, getProgram, getPollPda, SystemProgram } from "@/utils/program";

export default function CreatePoll() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [durationHours, setDurationHours] = useState(24);
  const [loading, setLoading] = useState(false);

  function updateOption(i: number, val: string) {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  }

  function addOption() {
    if (options.length < 5) setOptions([...options, ""]);
  }

  function removeOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!wallet.publicKey) return alert("Please connect your wallet first");
    const cleanOptions = options.map((s) => s.trim()).filter(Boolean);
    if (cleanOptions.length < 2) return alert("Please provide at least 2 options");
    if (!title.trim()) return alert("Please enter a title");

    setLoading(true);
    try {
      const program = getProgram(connection, wallet);
      const pollId = new BN(Date.now());
      const pollPda = getPollPda(pollId);
      const endTime = new BN(Math.floor(Date.now() / 1000) + durationHours * 3600);

      await program.methods
        .createPoll(pollId, title.trim(), description.trim(), cleanOptions, endTime)
        .accounts({
          poll: pollPda,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      router.push(`/poll/${pollPda.toString()}`);
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  const endPreview = new Date(Date.now() + durationHours * 3600 * 1000);
  const cleanOptions = options.filter((o) => o.trim());

  return (
    <main className="min-h-screen bg-app text-app">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 border-b border-app pb-6">
          <div className="data mb-1.5 text-sm uppercase tracking-[0.2em] text-app-faint">New poll</div>
          <h1 className="text-3xl font-bold text-app">Create a poll</h1>
        </div>

        {!wallet.publicKey ? (
          <div className="max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-amber-500/40">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v5M7 10h.01" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="data text-base uppercase tracking-widest text-amber-600 dark:text-amber-300">
              Connect your wallet to create a poll
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-10">
            {/* Form */}
            <div className="space-y-6">
              {/* Title */}
              <FormField label="Question" hint={`${title.length} / 100`}>
                <input
                  className="w-full rounded-md border border-app bg-app-surface px-4 py-3 text-base text-app placeholder:text-app-faint outline-none transition-colors focus:border-[color:var(--cyan)]/40"
                  placeholder="What should we decide?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </FormField>

              {/* Description */}
              <FormField label="Description" hint={`${description.length} / 280`} optional>
                <textarea
                  className="w-full resize-none rounded-md border border-app bg-app-surface px-4 py-3 text-base text-app placeholder:text-app-faint outline-none transition-colors focus:border-[color:var(--cyan)]/40"
                  placeholder="Add context for your voters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={280}
                  rows={3}
                />
              </FormField>

              {/* Options */}
              <FormField label={`Options`} hint={`${options.length} / 5`}>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="flex h-11 w-10 shrink-0 items-center justify-center rounded-md border border-app bg-app-elevated">
                        <span className="data text-sm font-bold text-app-faint">
                          {String.fromCharCode(65 + i)}
                        </span>
                      </div>
                      <input
                        className="flex-1 rounded-md border border-app bg-app-surface px-4 py-3 text-base text-app placeholder:text-app-faint outline-none transition-colors focus:border-[color:var(--cyan)]/40"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        maxLength={50}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(i)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-app text-app-faint transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <button
                      onClick={addOption}
                      className="flex w-full items-center gap-2 rounded-md border border-dashed border-app px-4 py-3 data text-sm uppercase tracking-widest text-app-faint transition-all hover:border-[color:var(--cyan)]/35 hover:text-[color:var(--cyan)]"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Add option
                    </button>
                  )}
                </div>
              </FormField>

              {/* Duration */}
              <FormField label="Duration">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-0">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      className="w-24 rounded-l-md border border-app bg-app-surface px-4 py-3 text-center text-base text-app outline-none transition-colors focus:border-[color:var(--cyan)]/40"
                      value={durationHours}
                      onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                    />
                    <div className="border-y border-r border-app bg-app-elevated px-4 py-3 data text-sm uppercase tracking-widest text-app-faint rounded-r-md">
                      hrs
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-app-faint">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                      <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <span className="data text-sm tracking-wide">
                      Ends {endPreview.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </FormField>

              {/* Submit */}
              <button
                onClick={submit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--cyan)] py-3 text-base font-bold tracking-wide text-slate-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#07070f]/30 border-t-[#07070f] rounded-full animate-spin" />
                    <span className="data text-base uppercase tracking-widest">Deploying on-chain...</span>
                  </>
                ) : (
                  <>
                    <span>Deploy poll on-chain</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="data text-center text-sm tracking-widest text-app-faint">
                // This will create an on-chain transaction · Devnet only
              </p>
            </div>

            {/* Live preview */}
            <div className="hidden lg:block">
              <div className="data mb-3 text-sm uppercase tracking-[0.2em] text-app-faint">Live preview</div>
              <div className="sticky top-20 overflow-hidden rounded-xl border border-app bg-app-surface shadow-[var(--shadow-soft)]">
                {/* Terminal bar */}
                <div className="flex items-center gap-2.5 border-b border-app bg-app-elevated px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full border border-app bg-app" />
                    <div className="h-2 w-2 rounded-full border border-app bg-app" />
                    <div className="h-2 w-2 rounded-full border border-app bg-app" />
                  </div>
                  <span className="data text-sm tracking-widest text-app-faint">poll_preview</span>
                </div>

                <div className="p-5">
                  {/* Status + title */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-lg font-semibold leading-snug text-app-secondary">
                      {title || (
                        <span className="italic text-app-faint">Your question...</span>
                      )}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 [border-color:color-mix(in_srgb,var(--green)_25%,transparent)] bg-[color:var(--success-soft)]">
                      <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--green)] animate-pulse" />
                      <span className="data text-sm uppercase tracking-widest text-[color:var(--green)]">Active</span>
                    </div>
                  </div>

                  {description && (
                    <p className="data mb-4 text-sm leading-relaxed text-app-secondary">{description}</p>
                  )}

                  {/* Options preview */}
                  <div className="space-y-1.5 mb-4">
                    {cleanOptions.length > 0 ? (
                      cleanOptions.map((opt, i) => (
                        <div
                          key={i}
                          className="flex h-11 items-center gap-2.5 rounded-md border border-app px-3"
                        >
                          <span className="data w-4 text-sm font-bold text-app-faint">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-base text-app-secondary">{opt}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex h-11 items-center rounded-md border border-dashed border-app px-3">
                          <span className="data text-sm text-app-faint">Option A</span>
                        </div>
                        <div className="flex h-11 items-center rounded-md border border-dashed border-app px-3">
                          <span className="data text-sm text-app-faint">Option B</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 border-t border-app pt-3">
                    <div className="flex justify-between">
                      <span className="data text-sm text-app-faint">Options</span>
                      <span className="data text-sm text-app-secondary">{cleanOptions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="data text-sm text-app-faint">Duration</span>
                      <span className="data text-sm text-app-secondary">{durationHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="data text-sm text-app-faint">Ends</span>
                      <span className="data text-sm text-app-secondary">
                        {endPreview.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function FormField({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="data text-sm uppercase tracking-[0.15em] text-app-secondary">{label}</label>
          {optional && (
            <span className="data text-sm uppercase tracking-widest text-app-faint">optional</span>
          )}
        </div>
        {hint && <span className="data text-sm text-app-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
