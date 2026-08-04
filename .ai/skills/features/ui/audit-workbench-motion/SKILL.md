---
name: audit-workbench-motion
description: Read-only analysis of web UI motion in a project that consumes the @willyu1007/web-workbench kit. Use when the user asks to review animation or transition code in a diff, component or PR; asks what should animate in a screen or flow; or wants a prioritized motion assessment of a surface. Never modify source, add a dependency, or invent duration, easing or threshold values.
---

# Audit workbench motion

The consumer-side motion skill. It judges motion in a **host app built on the
web-workbench kit** — where the chrome is locked and the host owns only its own
adapters, content, and app-local CSS. Web only.

## Contract

Remain read-only. Authority, in order:

1. `node_modules/@willyu1007/web-workbench/MOTION.md` — the decision gate, the
   reduced-motion requirements, and which motion the kit already covers.
2. `node_modules/@willyu1007/web-workbench/INTERACTION.md` — behavior under
   pointer, keyboard, and touch; the dependency rule.
3. `node_modules/@willyu1007/web-workbench/PARADIGMS.md` — read when a finding
   touches layout or a component's posture, not only its timing.
4. `node_modules/@willyu1007/web-workbench/dist/styles/tokens.css` — the actual
   token values available to this project.
5. `node_modules/@willyu1007/web-workbench/DECISIONS.md` — read before calling a
   kit value wrong; several are decisions, not drift.

Read them from `node_modules`, not from memory — they travel with the installed
version, so they describe the kit this project actually has. If they are absent,
the project is on a kit older than 0.12.1; say so and fall back to the kit
repository, noting that the contract you applied may not match the installed
version.

This skill owns motion findings only. Use general review standards only if the
user asked for a full code review.

## Triage by owner — do this first

The single question that makes a consumer-side audit useful: **who can fix it?**

| Motion lives in | Owner | What a finding means |
|---|---|---|
| A kit component's own transition or keyframe (`.wb-*`) | The kit | Not a host fix. Report it as an upstream item for `My-Workflow-Base/templates/web-workbench`, with enough evidence to act on there. Do not propose a host-side override. |
| Host CSS, host components, host route/page transitions | The host | Actionable here. |
| A kit token consumed at a host site | Shared | The *use* is the host's; the *value* is not. A value objection is an upstream token proposal, never a host literal. |

Two traps this table exists to prevent:

- **Reporting kit motion as host debt.** MOTION.md lists what the kit already
  handles in `prefers-reduced-motion: reduce` — scene reveal, toast, drawer,
  overlay, skeleton shimmer, nav status pulse, and the mobile sidebar. Do not
  file host findings for those. Host motion is the host's to cover; kit motion
  is not.
- **Proposing a host override to "fix" the kit.** An override is how a consumer
  forks the design system by accident. If the kit is wrong, say the kit is wrong.

## Select one mode

| Mode | Select when | Output |
|---|---|---|
| `review` | Existing motion in a focused diff, component, or PR must be judged. | Findings plus a motion-only approve/block decision. |
| `discover` | The user asks what should animate, or how to make a surface feel more alive. | At most five justified opportunities, plus the rejected candidates. |
| `audit` | A screen, flow, or app needs a prioritized motion assessment. | Ranked findings and implementation-ready handoff items. |

If a diff exists, default to `review`. Requests about opportunities, what should
animate, or how a surface should feel more alive or more coherent use
`discover`, even when the named surface is broad. Use `audit` only when the user
asks for an audit, assessment, or a complete inventory.

In `discover`, return at most five ranked items total. Prerequisite fixes count
toward the limit; merge or drop lower-priority items rather than exceed it.

Read `references/modes.md` after selecting; load only that mode's section.

## Workflow

1. Define the surface and the mode. Confirm the installed kit version from
   `node_modules/@willyu1007/web-workbench/package.json`.
2. Inventory the motion actually present: host CSS transitions and keyframes,
   any motion library, and which kit components the surface renders.
3. Triage every candidate by owner (table above) before judging it.
4. Map interaction frequency, and mark anything on a keyboard, streaming, or
   high-frequency path.
5. Apply MOTION.md's gate in order: frequency, purpose, safety, accessibility,
   performance. "No motion" is a valid and frequently correct outcome.
6. Cite file and line evidence. Where feel cannot be judged from source, say so
   rather than guessing.
7. Name an existing token role for every recommendation. If none fits, request a
   token proposal upstream — do not supply a number.

## What blocks, on the web

From MOTION.md and INTERACTION.md, plus the traps the kit itself hit:

- Motion that substitutes for authorization, or that delays or obscures an
  error, warning, or cancellation.
- No reduced-motion path — **and check both mechanisms.** `animation: none` does
  not stop a `transition`. A panel moved by `transition: transform` is untouched
  by a reduce block that only nulls `animation`; that exact gap once left the
  kit's own 280px mobile sidebar sweeping the viewport (DECISIONS.md D-A7).
- `transition: all`. The kit's shipped stylelint preset already blocks it, so
  finding one means the preset is not wired — report the wiring, not just the
  line.
- Avoidable delay on a high-frequency or keyboard-initiated action.
- A literal duration, easing, or color where a token exists.
- A new gesture, animation, or material runtime dependency introduced without an
  explicit decision. INTERACTION.md makes this a product decision, not a detail.

Two things that are **not** findings: a perpetual loop period (the 120/180/280ms
scale covers discrete state changes and deliberately has no loop role), and a
kit component literal already recorded in DECISIONS.md.

## Finding fields

| Field | Requirement |
|---|---|
| Location | File and line, component, or visible state. |
| Owner | `host`, `kit`, or `shared` — from the triage table. |
| Severity | `blocker`, `major`, `minor`, or `suggestion`. |
| Evidence | Current behavior, and which contract rule it violates or satisfies. |
| Target | Token-backed or contract-backed desired behavior. |
| Verification | Reduced-motion, keyboard, pointer-capability, and interruption checks needed. |

## Verification

- One mode selected, its output structure complete.
- Every finding carries an owner, and no `kit`-owned finding proposes a host fix.
- Every finding cites evidence and contract authority.
- Every recommendation names an existing token or requests an upstream proposal.
- No source, token, dependency, or task artifact changed.

## Boundaries

- Do not edit source, CSS, tokens, dependencies, or task docs.
- Do not copy external duration, easing, spring, blur, or threshold values into a
  recommendation — not from a blog, a library default, another design system, or
  your own priors. The kit's scale is the only source.
- Do not propose a host-side override of kit chrome, or a new color, layout, or
  component variant. PARADIGMS.md: controlled variants only.
- Do not recommend adding a motion or gesture library.
- Do not create a plan directory. Hand accepted work to whoever implements — the
  host's frontend skills for host-owned items, an upstream issue for kit-owned
  ones.
