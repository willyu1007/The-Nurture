import "@willyu1007/web-workbench/styles";
import "./fonts.css";
import "./globals.css";
import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Shell } from "@/components/shell";

// Variable fonts — no `weight` array, so the full axis loads.
const sans = Manrope({ subsets: ["latin"], variable: "--f-sans", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "swap",
});

export const metadata = { title: "The Nurture — Workbench" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
