"use client";

import type { ReactNode } from "react";
import { AppShell, type ShellNav } from "@willyu1007/web-workbench";

// The one config the scenario supplies to drive the app chrome. onSwitch lives
// here (client) because it is a callback; for the dev workbench it is a no-op.
const nav: ShellNav = {
  scenario: {
    current: "nurture",
    registered: [{ key: "nurture", name: "The Nurture", mark: "育" }],
    onSwitch: () => {},
  },
  groups: [
    {
      label: "工作流",
      items: [{ href: "/nurture/projects", label: "养育项目", match: ["/nurture/projects"] }],
    },
  ],
  sections: [],
  home: { label: "The Nurture", href: "/nurture/projects" },
};

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShell nav={nav} accountName="dev">
      {children}
    </AppShell>
  );
}
