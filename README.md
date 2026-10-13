# SkillWave

### Build your career, one intentional step at a time.

SkillWave is a browser-based professional development workspace that brings career roadmaps, soft-skills practice, networking activities, and progress tracking into one place. Create a profile, choose a target role, and keep your development activities and milestones organized as you grow.

## A look inside

| Career roadmap | Growth dashboard |
| --- | --- |
| ![SkillWave career roadmap](screenshots/roadmap.png) | ![SkillWave growth dashboard](screenshots/growth-snapshot.png) |

| Soft-skills practice | Networking tracker |
| --- | --- |
| ![SkillWave soft-skills practice](screenshots/soft-skills.png) | ![SkillWave networking tracker](screenshots/networking.png) |

## What you can do

- **Follow career roadmaps** with role-based skills, missions, and completion tracking.
- **Practice soft skills** through workplace scenarios and reflection activities. Prompts can be copied to an AI assistant; SkillWave does not call an AI service.
- **Build professional connections** with guided networking activities and a contact tracker.
- **See your progress** across technical skills, soft skills, and networking on the dashboard.
- **Manage your account** with sign-up, sign-in, password recovery, and account deletion.

## Built with

- HTML, CSS, and browser JavaScript (ES modules)
- Supabase Auth and PostgreSQL with Row Level Security (RLS)
- Supabase Edge Functions with TypeScript and Deno for account deletion
- Node.js for roadmap data validation

The frontend is static and has no build step.

## Run locally

From the repository root, start a static server:

```sh
python -m http.server 5500
```

On Windows, `py -m http.server 5500` also works. Open [http://localhost:5500](http://localhost:5500). Configure Supabase first to use authentication and saved account data.

## Supabase setup and security

Set the project URL and **publishable** browser key in `js/supabase-config.js`. Publishable keys are intended for client-side use; never place a secret or service-role key in frontend code. Supabase migrations define the application tables and RLS policies, so use an appropriately configured project for account-backed features.

Before applying migrations, confirm the linked Supabase project and compare local and remote migration history. The `contact_information` column exists in the remote database, but whether its migration is recorded as applied is still unverified. See [the setup guide](docs/SETUP.md) before taking migration-related action.

## Documentation

- [Supabase and migration setup](docs/SETUP.md)
- [Password recovery URL setup](SUPABASE_AUTH_SETUP.md)
- [Account deletion deployment](SUPABASE_ACCOUNT_DELETION.md)

Roadmap data can be checked with `npm run validate:roadmaps`. This command validates roadmap data; the repository does not define a general browser test suite.
