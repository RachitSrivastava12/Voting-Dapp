"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-app bg-app-surface px-4 text-sm font-medium text-app-secondary transition hover:bg-[color:var(--surface-hover)] hover:text-app"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="data text-sm uppercase tracking-[0.14em]">
        {isDark ? "Light" : "Dark"}
      </span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--cyan)]">
        {isDark ? "☀" : "◐"}
      </span>
    </button>
  );
}
