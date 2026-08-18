"use client";

import type { ReactNode } from "react";
import {
  AppShell,
  ToastProvider,
  useToast,
  type ShellNav,
} from "@willyu1007/web-workbench";

/**
 * The institution_workbench modules, grouped by what the admin is doing rather
 * than listed flat. A single group whose label restates the surface ("园区")
 * spends a level of hierarchy on nothing; the kit's groups exist to separate
 * kinds of work, which is how the sibling education workbench uses them.
 *
 * `soon` marks modules with no capability contract yet. The information
 * architecture lands once instead of growing an entry per release, and the kit
 * renders those visibly unavailable rather than linking nowhere.
 *
 * Every href is distinct and none is a prefix of another: the shell matches by
 * path prefix and takes the first hit, so overlapping routes light up the wrong
 * entry.
 */
const OVERVIEW_HREF = "/nurture/overview";

const GROUPS: ShellNav["groups"] = [
  // The hub is absent here on purpose: it is the shell's home entry. A nav item
  // pointing at the same route was a second control doing the same thing, and it
  // is why the sidebar used to mark two entries active at once.
  //
  // 入园流程 sits in 园区管理 rather than pulled out for being the busiest — the
  // workflow product contract scopes the current InstitutionWorkflow to
  // institution management, so that is the category it belongs to.
  {
    label: "园区管理",
    items: [
      // Not 流程队列: that names the mechanism, which the UX contract rules out.
      // Not 入园申请 either — the institution opens the inquiry, issues the offer
      // and proposes formalization, and the family consents; calling it an
      // application inverts who acts.
      { href: "/nurture/queue", label: "入园流程", badgeKey: "queue" },
      { href: "/nurture/people", label: "人员与关系", soon: true },
      { href: "/nurture/operations", label: "日常运营", soon: true },
      { href: "/nurture/outreach", label: "家长触达", soon: true },
      { href: "/nurture/grants", label: "授权申请", soon: true },
    ],
  },
  {
    label: "资料与洞察",
    items: [
      { href: "/nurture/knowledge", label: "园区知识", soon: true },
      { href: "/nurture/insight", label: "洞察", soon: true },
    ],
  },
];

// Placeholder until real authentication exists. The workbench binds one explicit
// role per session, rendered as the kit's topbar identity chip (0.19.0).
//
// `onSwitch` is deliberately absent: B3-0 gives the caregiver no domain web
// workbench at all, so no other role this account holds is reachable from here.
// The kit then lists them with their surface instead of offering a switch that
// leads nowhere. Wire `onSwitch` once a second role can actually be served.
const IDENTITY = {
  current: {
    key: "institution_admin",
    label: "园长 · 晨光园",
    surface: "机构 Web 操作台",
  },
  others: [
    {
      key: "class_teacher",
      label: "本班老师 · 托小班",
      surface: "仅移动端班级工作台",
    },
  ],
} as const;

/**
 * Nav is built inside the provider because its callbacks need `useToast`. The
 * kit leaves toast to the host — AppShell deliberately does not wrap it.
 */
function ShellWithNav({
  badges,
  children,
}: {
  readonly badges: Readonly<Record<string, number>>;
  readonly children: ReactNode;
}) {
  const toast = useToast();

  const nav: ShellNav = {
    // 托育 is the scenario's name wherever it is listed — the sibling education
    // workbench registers this same key/name in its own switcher, so the two must
    // agree or switching lands nowhere once it stops being a demo.
    scenario: {
      current: "nurture",
      registered: [{ key: "nurture", name: "托育", mark: "育" }],
      onSwitch: () => {},
    },
    identity: IDENTITY,
    groups: GROUPS,
    // The hub is the home entry, so it has no group item to derive a crumb from.
    // `activeCrumb` only walks groups and sections, which is exactly what this
    // section is for.
    sections: [{ prefix: OVERVIEW_HREF, label: "概览", href: OVERVIEW_HREF }],
    // Home is the hub itself, matching how the sibling education workbench uses
    // it. Pointing it at "/" would leave nothing marked active while the hub is
    // open; the earlier double-highlight came from the duplicate nav item, not
    // from this href.
    home: { label: "概览", href: OVERVIEW_HREF },
    // The paradigm puts quick global create in the sidebar, which keeps the
    // scene toolbar down to its single primary. Registering an inquiry is the
    // only thing this surface can create; the flow does not exist yet, so it is
    // marked the same way the unbuilt modules are.
    create: [{ href: "/nurture/queue/new", label: "登记新意向", soon: true }],
  };

  return (
    <AppShell
      nav={nav}
      accountName="dev"
      badges={badges}
      // The kit renders the search control whether or not a handler is supplied,
      // so leaving it unwired ships a button that does nothing.
      onSearch={() => toast.notify("info", "搜索尚未接入", "工作台的检索面还没有能力支撑。")}
    >
      {children}
    </AppShell>
  );
}

export function Shell({
  badges,
  children,
}: {
  readonly badges: Readonly<Record<string, number>>;
  readonly children: ReactNode;
}) {
  return (
    <ToastProvider>
      <ShellWithNav badges={badges}>{children}</ShellWithNav>
    </ToastProvider>
  );
}
