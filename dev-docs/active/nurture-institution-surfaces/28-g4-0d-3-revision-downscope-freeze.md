# G4-0D-3 Append-only Revision & Downscope — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Unit: 0D-3, after 0D-2 ([`25-g4-0d-scope-freeze.md`](./25-g4-0d-scope-freeze.md))
- Contract identity: `nurture.content-revision-downscope@1.0.0`
- Consumes: `ActivityPlacementV1` (0D-2) and the 0C chain unchanged
- Verdict: `G4_0D_3_FREEZE_PASS`
- Releases: G4-C, 0D-4
- Open points: **none**
- Schema delta: **`DELTA`** — planned below, not applied
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of revisions | Nurture Content domain | this record |
| Revised subjects | Nurture Content domain | `NurtureCareCapture`, `NurtureMediaAssetRef`, `ActivityPlacementV1` ([`27`](./27-g4-0d-2-schedule-placement-freeze.md)) |
| Attribution subject | T-006 | `NurtureChildMediaAttribution` — read here, mutated only per 0D-4 |
| Authority | 0C chain | [`13`](./13-g4-0c-3-class-child-scope-freeze.md) and its inputs |
| Consumers | G4-C, 0D-4 | — |
| Product source | `02-architecture.md` "Complete activity records in Web" | — |

`NurturePublishProcessRevision` already exists for the publish lane. It is a
different subject with a different lifecycle, and 0D-3 does **not** extend it;
reusing a revision table across two unrelated subjects would make "what was
revised" depend on which lane wrote the row.

## 2. Type boundaries

| Type | Class | Rule |
| --- | --- | --- |
| Original content | canonical, **immutable in place** | The teacher's body, media, author and capture/source time. No capability edits these. |
| `ContentRevision` | canonical, **append-only** | Every Admin change is a new row carrying the previous value. Nothing is updated in place and nothing is deleted. |
| `AttributionCorrectionCandidate` | **non-canonical candidate** | A sourced proposal that some child attribution is wrong. Confirmation belongs to 0D-4, never to this unit. |

The one-sentence rule: **an Admin may change where content sits and who can see
it, never what the content says or who made it.**

## 3. Frozen shape

```text
ContentRevisionV1
  subjectRef        the capture, media ref or placement revised
  subjectKind       "placement" | "visibility" | "institution_note"
  previousValue     the exact prior value, retained verbatim
  newValue          the value after this revision
  decidedByBefore   0D-2's placement level, when subjectKind is "placement"
  actorRef          roleAssignmentRef of the Admin
  reason            required, free text, retained
  supersedesRef     the revision this one replaces, absent for the first
  revisionHead      monotonic per subject
  occurredAt        server time
  contractVersion   "1.0.0"
```

`reason` is **required, not optional**. A revision chain whose entries do not
say why is an audit log that cannot answer the only question anyone asks of it.

**Fields a caller MUST NOT synthesize:** `previousValue`, `actorRef`,
`revisionHead`, `occurredAt`, `supersedesRef`. A caller supplying
`previousValue` could rewrite what the chain claims was there before.

**No face embedding is stored or presented, in any field, under any name.**
Automatic matching may retain only its permitted confirmation/provenance
result. This is an invariant, not a default.

## 4. Predicate

| Capability | Actor | May change |
| --- | --- | --- |
| `adjust_activity_placement` | `institution_admin` | placement within the same class ([`27`](./27-g4-0d-2-schedule-placement-freeze.md) §4) |
| `add_institution_note` | `institution_admin` | appends an institution-authored note beside the original |
| `downscope_content_visibility` | `institution_admin` | narrows visibility, or suspends publication eligibility |
| `raise_attribution_correction` | `institution_admin` | creates a **candidate** only |

All resolve through the 0C chain in its fixed order.

### Downscope is one-directional, and that is the load-bearing rule

`downscope_content_visibility` may **only narrow**. It can hide, restrict an
audience or suspend publication eligibility. It can never widen an audience,
un-hide content another actor hid, or restore publication eligibility that a
safety action removed.

Widening is not merely a different capability — it is a **different authority
question**, because the audience for a child's content derives from grants that
belong to the guardian, not to the institution. An Admin who could widen would
be granting on the guardian's behalf, which 0C-5 §2 already forbids in the
grant lane. This unit closes the same door in the content lane.

Reversing a downscope is therefore not an Admin edit. It is a new decision by
whoever holds that authority, recorded as its own revision with its own reason.

### What no capability here can do

- Edit the original body, media, author or capture/source time.
- Move content to another class — 0D-2 §4 already denies this, and no revision
  route reopens it.
- Confirm, add or replace a canonical child attribution. An Admin raises a
  candidate; only the current exact CareGroup caregiver resolves it (0D-4). A
  dual-role user switches roles, per 0C-1.
- Make content publishable. Downscope may remove publication eligibility;
  nothing here grants it.

**This unit emits no ordering.** A revision chain is returned in `revisionHead`
order, which is the chain's own structure rather than a ranking.

## 5. Lifecycle, versioning and concurrency

**Append-only means append-only.** No revision is updated or deleted, including
one made in error. A mistaken revision is corrected by appending another that
supersedes it, so the chain shows the mistake and the correction — which is the
history an audit needs and a silent delete destroys.

**`revisionHead`** is monotonic per subject. Every capability in §4 carries
`expectedRevisionHead` and rejects on mismatch rather than merging, matching
0D-1 and 0D-2.

**Idempotency.** Each capability carries a request id and is exact-replay safe:
the same identity returns the same revision and appends nothing further.

**Supersession is a link, not a replacement.** `supersedesRef` records which
revision this one displaces; both rows remain readable.

**Interaction with 0D-2's automatic placement.** 0D-2 froze that an Admin
decision wins and automatic placement never overwrites `decidedBy: "admin"`.
0D-3 carries the consequence: a placement revision records `decidedByBefore`,
so the chain can show that an automatic decision was replaced by a human one
rather than merely that a value changed.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Attempt to edit original body, media, author or time | deny `not_authorized` |
| Attempt to widen an audience or restore eligibility | deny `not_authorized` |
| Attempt to confirm or replace a child attribution | deny `not_authorized` |
| Attempt to move content to another class | deny `not_authorized` |
| `reason` absent or empty | deny `contract_mismatch` — never an empty-reason revision |
| `expectedRevisionHead` mismatch | deny `conflict`; never a merge |
| Class scope unresolved | inherit 0C-3's deny |
| Owner unavailable | deny `unavailable`; never a partial chain shown as complete |
| Contract version mismatch | deny `contract_mismatch` |

A partial revision chain is never rendered as a complete one. A reader seeing
three of five revisions would draw conclusions about a history they were not
shown.

## 7. Fixtures and gates

1. the original body, media, author and capture time are unchanged by every
   capability in §4;
2. a placement adjustment appends a revision carrying the previous value and
   `decidedByBefore`, and edits nothing in place;
3. a downscope narrows and is recorded; the inverse request denies;
4. un-hiding content another actor hid denies;
5. restoring publication eligibility removed by a safety action denies;
6. an Admin attribution correction creates a candidate and changes no canonical
   attribution;
7. a dual-role user is denied attribution confirmation under the admin role;
8. a revision with no reason denies;
9. a mistaken revision is corrected by appending, and both rows remain readable
   with the supersession link between them;
10. no revision is deletable by any capability;
11. `expectedRevisionHead` mismatch denies rather than merging;
12. replaying a request id appends nothing further;
13. no field, in any capability's response, carries a face embedding;
14. a partial chain denies rather than being returned as complete.

Synthetic fixtures under I0. Real owner paths stay behind I3, joint conformance
behind I4.

## 8. Schema delta

**`DELTA` — planned, not applied.**

| Planned | Purpose |
| --- | --- |
| `NurtureContentRevision` | the append-only chain: subject, kind, previous/new value, actor, reason, supersession, head |
| `NurtureAttributionCorrectionCandidate` | the sourced proposal 0D-4 resolves |

`NurtureCareCapture` gains no revision columns. Placement already lives in its
own row per 0D-2, and visibility state belongs to the revision chain rather
than to a mutable column on the capture — a column would be the in-place edit
this unit exists to prevent.

Migration authoring belongs to G4-C's implementation gate. G4-0 executes no
apply.

## Exit

`G4_0D_3_FREEZE_PASS` releases G4-C's Web activity records and 0D-4, which
consumes the correction candidate this unit defines. This record opens no
implementation, schema apply, capability rotation, activation, deployment or
traffic, and does not complete 0D.
