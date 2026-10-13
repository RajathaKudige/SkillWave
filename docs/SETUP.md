# Supabase setup

SkillWave serves its frontend as static files, but authentication and saved
profiles, progress, and contacts use Supabase. The frontend does not have a
build step.

## Configure the browser client

Set the Supabase project URL and publishable key in
[`js/supabase-config.js`](../js/supabase-config.js). A publishable key is
designed for browser use; never put a secret key, service-role key, access
token, or database password in frontend code or this repository. Database
access should be constrained by the project's Row Level Security policies.

## CLI and migration checks

Install the [Supabase CLI](https://supabase.com/docs/guides/cli). This repository
does not currently include `supabase/config.toml`; initialize local CLI
configuration with `supabase init` if needed. Sign in with `supabase login`,
then link the intended project:

```sh
supabase link --project-ref <YOUR_PROJECT_REF>
```

Keep CLI credentials in the CLI's supported credential storage or environment,
not in the repository. Before changing a database, verify the linked project
with `supabase projects list` and inspect migration status with
`supabase migration list`. Review all migrations reported as pending remotely.
`supabase db push` applies local migrations not recorded as applied in the
linked project's history, so confirm both the project and migration list before
using it. Do not infer migration history from the current database schema.

### Contact information column

The local migration
[`202610100001_networking_contact_information.sql`](../supabase/migrations/202610100001_networking_contact_information.sql)
adds a nullable `contact_information` text column to
`public.networking_contacts`. The column is confirmed present in the remote
database; its migration-ledger status remains unverified. The migration history
has not yet been reconciled. Inspect the remote history before deciding whether
reconciliation is needed. Column presence alone does not confirm that the
migration was recorded as applied.

To inspect the column without changing the database, run this read-only query in
the Supabase SQL Editor:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'networking_contacts'
  and column_name = 'contact_information';
```

Do not run `supabase db push`, repair migration history, or execute the
migration SQL remotely based only on this column check. The migration adds a
nullable column; it does not alter existing contact rows or RLS policies.

## Related configuration

- Add the password reset URL for each environment to Supabase Auth Redirect
  URLs. See [password recovery setup](../SUPABASE_AUTH_SETUP.md).
- Account deletion requires the `delete-account` Edge Function and a
  server-side secret. Keep JWT verification enabled and follow the
  [account deletion deployment guide](../SUPABASE_ACCOUNT_DELETION.md).
