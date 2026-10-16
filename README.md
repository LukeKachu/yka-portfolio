# YKA — Portfolio Website

The personal portfolio of **Yusuf Kerim Altay**, a social media content creator and digital marketing specialist. Built around the YKA identity, with Turkish and English content, a responsive light/dark interface, and a first-party `/admin` editor.

## Stack and features

- Next.js App Router, TypeScript, React and Tailwind CSS.
- Supabase PostgreSQL, authentication, row-level security and asset storage.
- Project/video archive, editable reach metrics, CV and resume sections.
- Admin authorization requires both a Supabase Auth session and membership in `admin_users`.
- Optional translation drafts require human review; generating a translation never publishes content.
- Consent-gated third-party media; privacy, cookie and terms pages in both languages.
- Contact form with validation, rate limiting and optional server-side Resend delivery.

Supabase supplies the content infrastructure; normal editing happens in this application. Cloudflare Workers build configuration is included; a live deployment has not yet been verified. Do not configure this server-rendered app as a static Pages export. Read the [deployment guide and experimental proxy limitation](docs/cloudflare-deployment.md) first.

## Local checks without credentials

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

Public pages render intentional empty states and `/admin` renders a setup notice until Supabase is configured.

## Supabase setup

1. Create a Supabase project.
2. Inspect `supabase/migrations/` before initializing. The original `001` migration is for a fresh database only. For an existing or partially initialized database, use the safe `002` reconciliation migration, then review the subsequent additive migrations in order. Never reset an existing database or blindly rerun the original migration.
3. In Authentication → Users, create the first admin user with a real email and password.
4. Copy that user's UUID.
5. In SQL Editor run `insert into public.admin_users(user_id) values ('THE-REAL-AUTH-USER-UUID');` using the copied UUID.
6. In Project Settings → API, copy the Project URL and Publishable key. If the project only provides a legacy anon key, use that instead.
7. Copy `.env.example` to `.env.local` and add only the real values.
8. Restart `npm run dev`, open `/admin/login`, and sign in.

The migration creates public `portfolio-public` and `resume-public` buckets. Public visitors can read intended files, while only authorized admins can upload, replace or delete them.

## Security model

- Public RLS policies expose only published content.
- Public users have no insert, update or delete policies.
- Authenticated users must also exist in `admin_users` before any content write or upload is allowed.
- No service-role key is used or exposed.
- `/admin` routes refresh and verify the Supabase session on the server.
- Server actions repeat admin authorization checks before writes.

## Optional translation

Project text can always be entered manually in Turkish and English. Optional generation uses server-only environment variables and writes only target-language fields with `needs_review` status. It never changes `published`.

## Configuration and publishing

Copy `.env.example` to `.env.local` and enter your own connection values locally. Never commit environment files, admin import passwords or API tokens. Only `NEXT_PUBLIC_` values intended for the browser belong in browser code; privileged credentials remain server-side. One-time import credentials must not be deployed.

Run `npm run check:repository` before committing. This checks Git candidate files against configured local credentials and common secret patterns without printing their values; it supplements, but does not replace, manual review and GitHub secret scanning.

The owner's CV PDF (`public/cv/`), personal resume seed (`seed/resume.json`) and one-time personal content reconciliation script are deliberately excluded from GitHub. They remain available locally. Resume entries come from Supabase; the public repository does not need a copy of their import data. `import:resume` is a local-only maintenance command and requires the excluded seed file; do not run it during deployment.

For a clean Cloudflare deployment, upload the intended public CV through `/admin/resume` to Supabase Storage and verify the resulting download link before launch. A GitHub clone does not include the local fallback PDF. Unit tests use a generated non-personal PDF, with an additional optional test for the local file.

See [email setup](docs/contact-email-setup.md), [video and CV setup](docs/video-and-resume-setup.md), [privacy launch checklist](docs/privacy-launch-checklist.md) and [local phone testing](docs/local-phone-testing.md).

GitHub Actions runs lint, type checking, unit tests, a Linux Workers build and a dry run on pushes and pull requests, without production credentials. It does not deploy, run database migrations or import content. Runtime/browser acceptance tests still need the configured environment.

## Content rights

Portfolio media, client trademarks, CV content and the YKA identity are not offered under an open-source content license. Their inclusion here does not grant permission to reuse them. No software license has been selected for this repository.
