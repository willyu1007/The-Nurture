import "@willyu1007/web-workbench/styles";
import "./globals.css";
import type { ReactNode } from "react";
import { Shell } from "@/components/shell";

export const metadata = { title: "The Nurture — Workbench" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
