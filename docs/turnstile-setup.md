# Contact bot protection — Cloudflare Turnstile

Turnstile is Cloudflare's alternative to Google reCAPTCHA. This integration protects
only server-delivered contact messages, not public pages, video previews or admin
authentication. Existing validation, honeypot, time checks and persistent database
rate limits remain enabled. It does not guarantee that all spam is eliminated.

## Dashboard setup

1. Open Cloudflare Dashboard and select the portfolio's account. Open **Turnstile**
   (use the Dashboard search if the sidebar groups it under application security).
   Choose **Add widget**.
2. Name it **YKA contact**. Allow the exact hostname
   `yka-portfolio.yusufkerimaltay77.workers.dev` — no `https://` and no `/tr` or `/en`.
   Do not allow all of `workers.dev`. Add an owned custom hostname later when used.
3. Select **Managed** mode and leave **pre-clearance disabled**. The form uses a
   single-use validation token, not a clearance cookie for the whole site.
4. Complete widget creation yourself. Do not send the generated Secret key in chat.
5. Under **Workers & Pages → yka-portfolio → Settings → Runtime variables and
   secrets → Production**, add both values:

   | Name | Type | Value source |
   | --- | --- | --- |
   | `TURNSTILE_SITE_KEY` | Variable | Widget's public Site key |
   | `TURNSTILE_SECRET_KEY` | Secret | Widget's Secret key |

   Use **Add variable and deploy**. The Site key is intentionally read on the server
   and passed as a public component prop at runtime: no `NEXT_PUBLIC_` prefix or
   Build variable is needed. Never put the Secret key into source code or build
   variables. Keep the existing Resend and Supabase settings unchanged.
6. Publish the updated code through the existing GitHub/Cloudflare workflow. The
   code alone does not activate a widget; keys alone do not update old code.

Both absent keys preserve the working form and its existing protections during
setup. **Once both are configured, every contact API submission requires successful
server-side Siteverify validation.** A missing/invalid/expired/reused token, action
mismatch or hostname mismatch cannot create a database record or send an email.
Partial configuration fails closed: API submissions are unavailable and the public
form offers the honest mail-client draft fallback. A verification service outage
also fails closed, preserves form text and never falls back to unchecked API sending.

## Verification

- Run `npm run check:contact` locally after configuring ignored `.env.local` values
  if local testing is needed. It checks presence only, never prints secrets or sends.
- Open the live contact page in a private tab; fill in a genuine enquiry. Submission
  is disabled until the challenge succeeds. Inspect the widget under light/dark
  themes and a narrow mobile viewport.
- Submit once. Check the result, **Resend → Emails → Delivered** and Gmail inbox/spam.
  Automated fixtures are not proof of live verification or mailbox delivery.
- In the widget's Cloudflare analytics, inspect validations after real submissions.
  Direct API requests without a valid token must be rejected. Do not load test keys
  on the production widget or temporarily disable server validation.
- Tokens expire after five minutes and are single-use. Every completed submission
  attempt gets a fresh widget/token. Retrying an unchanged message preserves its
  database and Resend deduplication identity; a fresh token must not create a new
  email identity.
- For localhost use a separate development widget/approved local hostnames, or
  Cloudflare's official test keys **only in an isolated development environment**.
  Do not add broad production hostname exceptions or invent keys.

The verification request contains only the token and server-held secret; contact
message fields are not forwarded to Siteverify. Browser security checks can still
process connection/device information. Privacy notices describe this separately
from optional theme storage and external video display preferences.

## Scope and remaining abuse surface

This is protection for the Next.js `/api/contact` path, **not a site-wide WAF rule**.
The existing Supabase `submit_contact_message` / `_v2` RPC functions remain callable
by the anonymous role under their current schema, with their existing validation
and rate limits. A direct Supabase RPC caller does not pass through this Next.js
Turnstile check. It cannot send email through Resend, but this integration alone
must not be presented as complete prevention of direct database-inbox spam.
Closing that path requires a separately reviewed database write-boundary change;
no auth/RLS changes, new database secrets or service-role credentials are introduced
by this widget integration. Public-page crawler controls are also a separate
Cloudflare WAF/Bot Management configuration, not a reason to challenge every viewer.

References: [widget creation](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/),
[server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
