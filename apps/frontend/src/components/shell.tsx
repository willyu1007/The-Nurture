"use client";

import { useState, type ReactNode } from "react";
import { AppShell, type ShellNav } from "@willyu1007/web-workbench";

// The institution_workbench modules, in the surface registry's
// orderedContentKinds order. `soon` marks the ones with no capability contract
// yet — the information architecture lands once instead of growing an item per
// release, and the kit renders those entries visibly unavailable rather than
// linking to a route that does not exist.
// Every module sits one level under /nurture, the hub included. The shell
// matches nav items by path prefix and takes the first hit, so a hub at bare
// `/nurture` would swallow every sibling route and keep itself highlighted.
const MODULES = [
  { href: "/nurture/overview", label: "概览台" },
  { href: "/nurture/queue", label: "流程队列" },
  { href: "/nurture/people", label: "人员与关系", soon: true },
  { href: "/nurture/operations", label: "日常运营", soon: true },
  { href: "/nurture/outreach", label: "家长触达", soon: true },
  { href: "/nurture/knowledge", label: "园区知识", soon: true },
  { href: "/nurture/grants", label: "授权申请", soon: true },
  { href: "/nurture/insight", label: "洞察", soon: true },
] as const;

// Placeholder until P3 supplies the fixtures module. `active` is the bound role
// for this session; `others` are roles the account holds that this surface
// cannot serve — B3-0 gives the caregiver no domain web workbench at all, so
// they are listed with the reason instead of an switch that leads nowhere.
const ROLES = {
  active: { label: "园长 · 晨光园", surface: "机构 Web 操作台" },
  others: [{ label: "本班老师 · 托小班", surface: "仅移动端班级工作台" }],
};

// onSwitch lives here (client) because it is a callback; the dev workbench has
// no second registered scenario, so it is a no-op.
const nav: ShellNav = {
  scenario: {
    current: "nurture",
    registered: [{ key: "nurture", name: "The Nurture", mark: "育" }],
    onSwitch: () => {},
  },
  groups: [{ label: "园区", items: MODULES.map((m) => ({ ...m })) }],
  sections: [],
  home: { label: "The Nurture", href: "/nurture/overview" },
};

/**
 * Active-role binding. The workbench binds one explicit role per session; the
 * kit's AppShell has no topbar slot, so this renders as the first strip of the
 * content area instead. Switching is a plain navigation — the role grants
 * nothing on its own, so there is no confirmation step.
 */
function RoleBar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="nurture-rolebar">
      <div className="nurture-rolebar__id">
        <span className="mt-caption">当前角色</span>
        <span className="mt-chip">{ROLES.active.label}</span>
      </div>
      <button
        type="button"
        className="mt-btn mt-btn--ghost mt-btn--sm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        切换角色
      </button>
      {open ? (
        <div className="nurture-rolebar__menu">
          <p className="mt-caption">当前</p>
          <p className="mt-body">
            {ROLES.active.label} — {ROLES.active.surface}
          </p>
          <p className="mt-caption">该账号的其他角色</p>
          {ROLES.others.map((r) => (
            <p className="mt-body" key={r.label}>
              {r.label} — {r.surface}
            </p>
          ))}
          <p className="mt-caption">
            角色本身不授予权限；每次读取与动作仍会重新校验范围与授权。
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShell nav={nav} accountName="dev">
      <RoleBar />
      {children}
    </AppShell>
  );
}
