# Cloudflare Workers deployment

This is a full-stack Next.js application, not a static Pages export. Supabase remains the database/auth/storage provider. No database migrations, accounts, paid plans or Cloudflare resources are created by the local preparation steps.

## Compatibility gate

The project pins Next.js 16.4.1, OpenNext 1.20.12 and Wrangler 4.151.1. The normal `npm run dev`, `npm run build` and `npm start` workflow remains available. The application still uses `proxy.ts` and repeats authorization in protected layouts/server actions plus database RLS.

**OpenNext marks Node.js proxy/middleware support experimental and unsupported by its maintainers.** A successful build does not remove that limitation. Do not rename/remove the proxy, downgrade Next.js or bypass authorization to get a green deployment. Decide whether to accept this limitation after testing, or separately evaluate Cloudflare's recommended vinext runtime. No vinext migration has been performed.

## Verify before publishing

```bash
npm ci
npm run check:repository
npm run lint
npm run typecheck
npm run test:content
npm run test:contact
npm run test:privacy
npm run test:security
npm run build:cloudflare
npm run check:cloudflare
```

`build:cloudflare` includes the normal Next.js production build. `check:cloudflare` is a Wrangler dry run; it does not deploy. Prefer a clean Linux build for release; upstream does not guarantee full Windows support. Local Workers preview is loopback-only at port 3002 (`npm run preview:cloudflare` after building).

OpenNext can embed local `.env` contents in generated output. Never upload a local build containing import credentials. `npm run deploy:cloudflare` checks generated files for known private values and blocks deployment when found. Build releases from the clean Git checkout in Cloudflare, not from this computer's ignored `.env.local`. The preflight supplements manual review; it is not proof that every possible secret has been detected.

## Dashboard setup (after the compatibility decision)

1. Open Workers & Pages, create a **Worker** and choose the GitHub import flow. Authorize the Cloudflare GitHub app yourself, with access to **only** `LukeKachu/yka-portfolio`, not all repositories.
2. Select the repository and its `main` branch. Root directory is the repository root. Use `npm run build:cloudflare` for the build command and `npm run deploy:cloudflare` for the deploy command. Do not use Pages output directory `out`, static export, or `next-on-pages`. Keep the Worker name `yka-portfolio` aligned with `wrangler.jsonc` and its self-reference.
3. Set these **Build variables and secrets** before building: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Use the existing real Supabase connection and the actual HTTPS site URL. These public-prefixed values are intentionally browser-visible. Never substitute a service-role key.
4. Set the same public values in **Settings → Variables and Secrets** for runtime. Add `RESEND_API_KEY` as a runtime Secret and `CONTACT_FROM_EMAIL` for a verified sender when email is ready. Configure optional translation, Stream or CV assistant credentials as runtime Secrets only if using those features. See `.env.example` for names; do not upload the file with real values.
5. **Never configure `SUPABASE_IMPORT_ADMIN_EMAIL` or `SUPABASE_IMPORT_ADMIN_PASSWORD` on Cloudflare or GitHub.** Do not run imports/migrations in the deployment build. `keep_vars` preserves Dashboard runtime variables.
6. Check the dry-run compressed Worker size against the selected plan and obtain approval before enabling billing or paid features. R2/KV/Images bindings are not provisioned by this setup. No full-page caching rule should be added to `/admin`, auth responses or POST endpoints.
7. Once the real HTTPS address is known, update the site URL build/runtime variables and Supabase Auth URL configuration as appropriate, then rebuild. Check every public route, media consent, admin login/logout, an authorized admin action and an anonymous denial. Complete the contact migrations/email setup and verify a genuine delivered message before claiming the form works live.

The personal CV and resume import data are not in GitHub. Before launch, use `/admin/resume` to upload the intended public PDF to Supabase Storage and verify its download/view links. The database's existing resume entries are preserved. No automatic PDF upload or database change is performed by Git publishing.

Sources checked on 2026-10-16: [Cloudflare OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [OpenNext setup](https://opennext.js.org/cloudflare/get-started), [environment handling](https://opennext.js.org/cloudflare/howtos/env-vars). Cloudflare now recommends [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) for new Workers deployments; the adapter here preserves the existing Next.js build rather than silently changing runtimes.
