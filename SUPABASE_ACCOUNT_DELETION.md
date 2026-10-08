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

The Career Paths database migration adds `career_paths`, referencing
`auth.users(id) ON DELETE CASCADE`. The roadmap progress tables keep their
existing user ownership and role-based keys during the compatibility rollout;
their nullable `path_id` columns reference `(career_paths.id, user_id)` with
`ON DELETE CASCADE`. Deleting an Auth user therefore removes their profile,
career paths, and user-owned progress/contact rows. Deleting a career path
directly is not granted to authenticated clients, so routine path management
cannot cascade away roadmap progress.
