/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07070f",
        surface: "#0b0b17",
        elevated: "#0f0f1e",
        cyan: "#00d4ff",
        neon: "#00ff88",
      },
      fontFamily: {
        mono: ['"SFMono-Regular"', '"SF Mono"', "Consolas", '"Liberation Mono"', "Menlo", "monospace"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
