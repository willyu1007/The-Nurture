# Disposable database connection check

- Target: loopback PostgreSQL 16 in the existing `nurture-postgres` developer
  container.
- Database: `t011_w3_carrier_disposable_20260815`, created only after an exact
  catalog query proved that name absent.
- Isolation: the shared local `nurture` database, staging and production were
  not migrated or written.
- Secret handling: evidence records no connection URL or credential value.
