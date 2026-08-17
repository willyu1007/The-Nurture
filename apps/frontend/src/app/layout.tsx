import "@willyu1007/web-workbench/styles";
import "./fonts.css";
import "./globals.css";
import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Shell } from "@/components/shell";
import { countAwaitingAdmin } from "@/lib/queries/enrollment-journey";

// Variable fonts — no `weight` array, so the full axis loads.
const sans = Manrope({ subsets: ["latin"], variable: "--f-sans", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "swap",
});

export const metadata = { title: "The Nurture — Workbench" };

// Async so the nav badge carries a real count. The shell is a client component
// and cannot query, so the layout resolves it here and passes plain data down.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const badges = { queue: await countAwaitingAdmin() };
  return (
    <html lang="zh" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Shell badges={badges}>{children}</Shell>
      </body>
    </html>
  );
}
