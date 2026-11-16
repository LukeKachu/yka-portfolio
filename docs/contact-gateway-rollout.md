# Contact spam protection: safe rollout

The old `submit_contact_message` and `_v2` RPCs accepted anonymous calls without
passing through Next.js/Turnstile. This patch adds `_v3`, protected by a scoped
server-to-database secret, and removes legacy access in a separate activation step.
No service-role key, database reset, contact deletion, admin/Auth change or RLS
disablement is involved. The phone field is optional throughout the new path.

## Order matters — do not apply every pending migration blindly

1. In the existing Supabase project's **SQL Editor**, run
   `supabase/migrations/202611160008_prepare_contact_gateway.sql`.
   It creates the private key and guarded RPC but leaves the currently deployed
   legacy form working. **The old bypass is NOT closed at this stage.**
2. In that same trusted SQL Editor, run the following privately:

   ```sql
   select secret from portfolio_private.contact_gateway where singleton;
   ```

   Copy the result directly to **Cloudflare → Workers & Pages → yka-portfolio →
   Settings → runtime Variables and Secrets → Production**, as
   **`CONTACT_GATEWAY_SECRET`**, type **Secret**. Do not paste its value in chat,
   commit it, put it in Build variables, expose the private schema in Data API
   settings, or use a `NEXT_PUBLIC_` prefix. For local use only, put it in ignored
   `.env.local`. No new secret is created or copied automatically by this patch.
3. Preserve the existing Supabase, Resend and both Turnstile runtime settings.
   Deploy the new application code through the normal GitHub/Cloudflare workflow.
   The new code never falls back to an unguarded RPC. Missing protection config
   offers an honest mail-app draft instead of claiming server delivery.
4. Submit one genuine enquiry on the live site **without a phone number**. Check
   the success result, Supabase's saved message, Resend's delivery status and the
   Gmail mailbox. Do not seed a fictitious visitor or publish the key in screenshots.
5. Only after that succeeds, run
   `supabase/migrations/202611160009_enforce_contact_gateway.sql` in SQL Editor.
   It revokes anonymous/authenticated execution of v1/v2 and direct table INSERT.
   It refuses activation until the guarded RPC has successfully saved a message.
   That guard proves the DB path, **not** mailbox delivery or correct production
   deployment; the real check in step 4 is still mandatory.
6. Run `supabase/diagnostics/check_contact_gateway.sql` (read-only; no secrets).
   v1/v2 execution and direct inserts must be false for `anon` and `authenticated`;
   v3 execution is true but always requires the server key. Private schema/table
   read access must be false. Test another genuine enquiry after activation.

Do not rerun the old 004/007 migrations after activation: they restore the insecure
legacy grants. Re-running 008/009 preserves the secret, records and closed grants.
Both new migrations use transactions and preserve contact SELECT/UPDATE policies.
Unrelated portfolio reads, admin authorization and storage are unchanged.

## Trust boundary and limitations

The public form sends only a Turnstile token. The Next.js API validates it with
Cloudflare before invoking v3. Only its separate server-only Supabase client adds
`x-contact-gateway-key`; browser headers and authentication cookies are not copied.
The private key grants only this narrow contact operation, not unrestricted DB
access. Use HTTPS and keep provider-side request header logging access restricted.

The new API requires all protection settings even if both Turnstile keys are
missing. Verification outages fail closed. Rate limits are serialized and remain
three new records/address/hour and ten/email/day; changing User-Agent no longer
changes the per-address fingerprint. IP changes/distributed spam remain possible;
this is risk reduction, not a promise of zero abuse. Email retries retain the same
request/database identity and provider idempotency key.

An email outage still requires visitor retry; there is no background mail queue.
Revoking old function grants does not undo already stored messages. Do not roll
back by restoring anonymous legacy grants. Fix the new configuration or temporarily
use the mail-app draft path instead.

## Local verification

`npm run test:contact` uses disposable PostgreSQL and mocked providers; it tests
denial of v1/v2/table writes after activation, v3 denial without/wrong key, valid
server submission, optional/invalid phone, retries, rate limits, private key
isolation, repeated migrations and preservation of existing records. Browser
fixtures intercept successful submissions and provider traffic; they are not
proof of real email delivery. Never point fixture tests at production.
