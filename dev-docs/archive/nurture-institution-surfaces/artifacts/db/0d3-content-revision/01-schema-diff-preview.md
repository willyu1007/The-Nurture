# Schema Diff Preview — 0D-3 Content Revision

The repo Prisma SSOT adds one enum and one table owned by the 0D-3 Content
domain:

- `NurtureContentRevisionSubjectKind` closes the three independent lanes to
  `placement`, `visibility` and `institution_note`;
- `nurture_content_revision` stores the typed subject ref, exact previous/new
  value, Admin assignment, required reason, supersession link, per-lane head,
  command identity, contract version and server time.

The migration is additive. It adds primary/unique/read indexes, restrictive
foreign keys, lane/head/value/hash checks, a contiguous-chain insert trigger
and an update/delete rejection trigger. No existing table, column, enum or row
is removed.

The migration deliberately aborts if a target already contains an
`NurtureActivityPlacement.decidedBy = admin` row without the required revision
history. The migration has no truthful actor/reason/previous value from which
to invent an audit row; adoption or backfill of such data must therefore be a
separate approved decision.

Placement continues to use `nurture_activity_placement` as its current read
projection, but its former standalone Admin update method is removed. The only
Admin writer now advances that projection and appends its revision in one
Serializable command transaction. Visibility and institution notes receive no
mutable shadow column. `NurturePublishProcessRevision` remains untouched and
separate.
