# Institution workbench

This Next.js app hosts `web_domain_workbench` — the Nurture-owned scenario
business workbench at route namespace `/nurture`. Its current and only surface
instance is `institution_workbench`, which serves the `institution_admin` role.

It is not My-Chat's `web_run_workbench`: that is a separate generic Workflow Run
surface and grants no Nurture business access. Shared production dashboard,
notification, deep-link and admin surfaces remain owned by My-Chat.

UI comes from the pinned `@willyu1007/web-workbench` kit, which is the UI/UX
source of truth for layout, paradigms and design tokens.

## Running

```bash
pnpm --filter @the-nurture/frontend dev
```

Serves on `3201`. No backend is required or consulted: no scenario-service
controller serves `institution_workbench` yet, so screens read from local
fixtures. The former proxy to the retired legacy host has been removed and
returns when the real ingress exists.
