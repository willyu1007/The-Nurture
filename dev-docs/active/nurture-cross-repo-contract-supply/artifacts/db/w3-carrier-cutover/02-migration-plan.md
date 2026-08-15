# Migration plan

1. Replay the existing migration history from an empty disposable database.
2. Compare the resulting database to `prisma/schema.prisma` with exit-code
   enforcement.
3. Retire only the three redundant id-only family-growth foreign keys in a new
   forward migration; retain their stricter workspace-scoped replacements.
4. Apply the repair to the disposable database and require 44/44 status plus
   zero schema diff.
5. Run W3/W11 focused transactions and the complete DB suite, then destroy the
   exact disposable target.

The repair removes no table, column, index or unique/check invariant. There is
no down migration and `prisma db push` / `migrate reset` are prohibited.
