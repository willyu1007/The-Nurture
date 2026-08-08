-- PostgreSQL requires newly added enum values to commit before constraints or
-- defaults may reference them. Keep this state extension in its own migration.

ALTER TYPE "NurtureC30ProtectedContentLifecycle"
ADD VALUE 'provisioning' BEFORE 'active';
ALTER TYPE "NurtureC30ProtectedContentLifecycle"
ADD VALUE 'erasing' AFTER 'active';
