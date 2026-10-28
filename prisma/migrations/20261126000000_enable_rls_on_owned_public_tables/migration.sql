-- Prisma owns the app tables it creates. Keep them inaccessible through
-- Supabase's public Data API unless an explicit RLS policy is added. The app
-- server connects with a dedicated BYPASSRLS role and enforces authorization.
DO $$
DECLARE
  app_table record;
BEGIN
  FOR app_table IN
    SELECT namespace.nspname, relation.relname
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
      AND relation.relowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
      AND relation.relname <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', app_table.nspname, app_table.relname);
  END LOOP;
END
$$;
