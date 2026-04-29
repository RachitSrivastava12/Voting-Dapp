import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Voting dApp",
  description: "Decentralized voting on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <WalletContextProvider>{children}</WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
