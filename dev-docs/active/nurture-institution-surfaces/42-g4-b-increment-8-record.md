# G4-B Increment 8 — Institution Class-day Detail

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: `InstitutionClassDayDetailProjectionV1`, using frozen 0C scope/
  Grant authority, 0D-1 attendance and 0D-2 schedule/placement
- Commits: `d82895f`, `74f3fc2`
- Schema: **none**
- Effect level: **I1 only**

The detail behind the class card now exists. This closes G-06 in the live
register; it does not create a production caller or advance the branch to I2.

## Projection boundary

The framework-free service first resolves the exact class as a `care_group`
through `NurtureInstitutionAuthorityChain`. A missing, archived, foreign or
otherwise unauthorized class denies before schedule, captures, attendance or
communication facts are loaded.

After authorization it returns:

- the effective schedule and full per-activity photo/text/voice-transcript
  timeline;
- a visible `unplaced` collection for class-owned sources that have no valid
  activity placement;
- formal attendance submission/reopen state and monotonic head;
- today's communication state as revalidated, body-free message target refs;
- family feedback and institution outreach split by canonical direction; and
- optional child evidence only after the exact target, purpose, direction and
  data class resolve at `grant_scope` for this class.

Capture source IDs and child-evidence source IDs are passed through an injected
actor-bound ref issuer. A future production composer must inject the existing
keyed issuer; this I1 increment deliberately registers no capability and has no
caller.

## Protected-content and communication safety

Text and voice-transcript envelopes remain sealed in the repository. They are
opened only inside the authorized service composition. If any protected body
is missing, malformed or cannot pass its integrity check, the **whole detail**
returns `protected_content_unavailable`; it never drops the row and presents a
plausible partial day.

The class communication list does not invent a list-level policy. Every
candidate reuses the existing single-message Institution Admin owner-read,
including current participant/role, Enrollment/CareGroup/Institution, exact
Grant target/axes/purpose, disclosure snapshot, authorship, correction,
redaction and lifecycle checks. The list applies its bound after authorization,
so an earlier undisclosed row cannot consume an authorized result. No message
body enters the class-day projection; following its target ref must re-run the
single-message owner-read.

## Repository boundary

`PrismaInstitutionClassDayDetailRepository` delegates schedule resolution to
the existing 0D-2 repository/domain resolver and communication admission to the
existing owner-read port. It reads stable class-day captures, current ready
media, stored placement, body-free attendance state and grant-authorized child
evidence. Prisma remains absent from the domain service and its port types.

No new table or persisted field was required.

## Safety evidence

The unit lane asserts:

- the activity timeline, unplaced collection, attendance and home/institution
  direction split;
- denial before any detail repository read;
- whole-projection refusal for an invalid protected envelope; and
- no child evidence load without exact `grant_scope`.

The production-DB lane asserts over real rows:

- direct `care_group` resolution through the stored Admin role and Institution;
- AES-GCM text opening only on the authorized path, with an unplaced ready
  photo and formal attendance in the same projection;
- exact communication disclosure, with private body and raw message ID absent;
- post-authorization limit semantics when an earlier candidate lacks Admin
  disclosure; and
- a foreign class denial.

## Verification

- TypeScript: zero errors (`pnpm exec tsc --noEmit`).
- Unit: **807/807**, 71 files.
- Production DB: **346/346**, 35 files, disposable PostgreSQL.
- `verify:test-routing`, `verify:persistence-boundaries`,
  `verify:surface-conformance`, `verify:g2-exit-contract` and
  `verify:g3-0-freeze`: PASS.
- Direct frontend ESLint/stylelint: PASS. The root lint wrapper stops before
  lint/build on the attributed My-Chat pin mismatch.
- C30-I3 lock re-frozen at `74f3fc2`; source hash `24975fe8…`: PASS.
- Nurture self-pin re-frozen to `d34a2252…` over 218 files.

`verify:workflow-contract-pin` remains red at the external My-Chat revision
check: pinned `567b96c`, observed `ca782b6`. The Nurture self-pin matches
current bytes; adopting the sibling checkout is G-09 and is outside this
increment.

## Non-effects and next step

No capability/manifest/contract rotation, production caller, shared or durable
database apply, deployment, activation or traffic was introduced.

The next bounded increment should be 0D-5
`InstitutionSupportSignalProjectionV1`: it closes the already-owed aggregate
ordering fixture and supplies the deterministic signals still missing from the
otherwise navigable Admin board. 0D-3 revision/downscope follows; automatic
placement intake wiring remains a separate correctness increment rather than
being hidden inside either feature.
