# T-009 Verification

Evidence accumulates per increment (see `01-plan.md` DoD lines). Empty until
the first increment lands.

| Increment | Gate | Evidence | Result |
| --- | --- | --- | --- |
| I1 | `pnpm test:unit` incl. JCS vectors + schema-shaped envelope fixtures | 55 files / 603 tests green (24 new across jcs/assembler/receipt suites); digest parity test replicates the consumer verifier algorithm; `tsc --noEmit` adds zero new errors (one pre-existing live-sibling drift error, see notes) | PASS |
| I2 | migration deployed, zero drift, boundary green, `pnpm test:db` green | 17/17 migrations; `migrate diff` empty; boundary 63 tables / 93 enums; 23 files / 238 DB tests incl. `t009-family-growth-outbox` (tx atomicity both rollback directions, released-once partial unique, kind/source + digest + receipt-companion CHECKs, claim/backoff/settle, receipt replay no-op); evidence in `artifacts/db/i2/` | PASS |
| I4 | resolver unit suite all deny reasons + integration over real binding rows | 9 unit tests (every deny reason, boundary expiry, exchange-not-called-on-local-deny) + 7 integration tests (healthy resolve with owner-ref handshake, missing/revoked/quarantined/expired chains, target mismatch, exchange unavailable); `pnpm test:unit` 612 green | PASS |
| I3 (non-wire) | release+outbox and lineage+outbox pair atomicity, replay identity, default-off parity | `t009-family-growth-emission` 8 integration tests (committed triple with schema-valid stored envelope binding exact row ids and verifiable digest; exact replay appends nothing; invalid emission rejects write-free incl. freeze rollback; no-emission path emits zero rows; lifecycle envelope target copied from storage; skip when release never delivered; correction-without-text fails the pair closed; redaction without body) + 3 harness tests (denied → `binding_unavailable` before commit, prepared rides into commit input, absent preparer keeps exact G3-D input shape); suites 615 unit / 246 DB green; `tsc` zero new errors | PASS |
