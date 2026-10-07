# Supabase password recovery URL setup

The recovery request builds its destination from the current page URL and appends
`reset-password.html`. This supports local servers, deployed origins, and sites
hosted below a path without baking a production hostname into the client.

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Keep **Site URL** set to the deployed SkillWave site's canonical origin and
   base path once that deployment URL is known. This is the provider fallback;
   recovery requests in this app pass an explicit redirect URL.
2. Add the full reset page URL for each environment to **Redirect URLs**. For
   local development, use the exact origin and port served by your local web
   server, for example `http://localhost:5500/reset-password.html` (replace
   `5500` if your server uses a different port). For production, add
   `https://<your-deployed-host>/<optional-base-path>/reset-password.html` with
   the real deployed host and path. Do not leave the angle-bracket placeholder
   in the dashboard.

The production hostname is not present in this repository, so it must be filled
from the actual deployment. If the URL is not allowlisted, Supabase may reject
the redirect or use its configured Site URL instead.

The app uses Supabase's built-in Auth recovery email and `resetPasswordForEmail`;
there is no custom email service or custom email-template URL assumption in this
repository. The default Supabase recovery template should preserve its standard
confirmation link so Supabase can establish the recovery session before sending
the user to the requested reset page.
