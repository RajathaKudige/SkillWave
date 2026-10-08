# Account deletion deployment

The frontend calls the `delete-account` Supabase Edge Function. The repository
does not currently contain Supabase CLI configuration or deployed function
metadata, so deploy the function to the same project as the frontend:

```sh
supabase link --project-ref xbsssjglkmwaoandpqvh
supabase functions deploy delete-account
```

Keep JWT verification enabled. Do not deploy this function with
`--no-verify-jwt`; the function also verifies the caller's bearer token with
Supabase Auth before it obtains the deletion target.

The hosted Edge Function runtime provides `SUPABASE_URL` and its server-side
secret-key environment. The function reads `SUPABASE_SECRET_KEYS` (the `default`
key) and supports the legacy `SUPABASE_SERVICE_ROLE_KEY` variable as a fallback.
If deploying to a nonstandard runtime where neither is present, configure the
secret only in the Supabase Edge Function secrets settings. Never add it to
frontend files, this repository, or client-side build configuration.

No schema or RLS changes are required. Existing `ON DELETE CASCADE` foreign
keys remove the profile and user-owned progress/contact rows when the Auth user
is permanently deleted.
