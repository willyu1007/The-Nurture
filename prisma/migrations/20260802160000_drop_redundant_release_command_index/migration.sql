-- Drops uq_nurture_publication_release_command.
--
-- `publish_process_target_id` is already UNIQUE on this table, so the composite
-- could never be the constraint that fired: one release per target is enforced
-- by the single column, and the exact-replay check is explicit in
-- commitTargetRelease. Keeping the composite implied the command hash carried
-- part of the guarantee at the database level, which it never did.

-- DropIndex
DROP INDEX "uq_nurture_publication_release_command";

