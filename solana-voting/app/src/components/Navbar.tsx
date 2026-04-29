"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const path = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-app bg-[color:color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-6 w-6 items-center justify-center border transition-colors [border-color:color-mix(in_srgb,var(--cyan)_40%,transparent)] group-hover:[border-color:color-mix(in_srgb,var(--cyan)_75%,transparent)]">
            <div className="h-2.5 w-2.5 bg-[color:var(--cyan)]" />
          </div>
          <span className="data text-sm font-semibold uppercase tracking-[0.18em] text-app-secondary transition-colors group-hover:text-app">
            SolanaVote
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {[
            { href: "/polls", label: "Polls" },
            { href: "/create", label: "Create" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex h-11 items-center rounded-lg px-4 data text-sm uppercase tracking-[0.15em] transition-all ${
                path?.startsWith(href)
                  ? "bg-[color:var(--accent-soft)] text-[color:var(--cyan)]"
                  : "text-app-muted hover:bg-[color:var(--surface-hover)] hover:text-app"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}
