# Contact form delivery

The form sends to **yusufkerimaltay77@gmail.com**. Name, email, phone, subject and message are included. The visitor's email is `Reply-To`; it must not be used as the sender because it would fail domain authentication.

## One-time configuration

1. In Supabase SQL Editor, run `supabase/migrations/202608300004_contact_messages.sql` if not already applied, then `supabase/migrations/202610160007_contact_phone.sql`. Both are additive and re-runnable; existing messages are preserved. No service-role credential is needed.
2. In [Resend Domains](https://resend.com/domains), add a domain you own and add the DNS records Resend provides. Wait until the domain is verified. Do not invent DNS values. A Gmail address cannot be used as your verified sending domain.
3. In [Resend API Keys](https://resend.com/api-keys), create a sending-only key restricted to that domain. Keep it private.
4. Set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` in the ignored root `.env.local`. The sender format is `YKA <address@your-verified-domain>` (use your actual address, not this placeholder). Configure the same variables on the production host. Never prefix these with `NEXT_PUBLIC_`. Restart the development server / redeploy after configuration.
5. Run `npm run check:contact`. This is read-only and checks configuration and the database columns without printing secrets. It does not claim an email was delivered.
6. Submit one genuine enquiry through `/tr/contact` with a reachable reply address and phone number. In Resend **Emails**, verify its status is **Delivered**, then check the recipient's inbox/spam. Reply to confirm `Reply-To`. An API acceptance alone does not guarantee inbox placement.

Until email configuration exists, the form remains usable as a mail-client composer: “Prepare email draft” encodes all fields into a mailto draft and reveals an explicit “Open in your email app” link. The visitor completes sending in their mail application. Preparing the draft does not POST, save to Supabase, open another application automatically, or claim that a message was sent. The link remains available if no default mail application launches. After configuration, the same form switches to server delivery. A provider failure preserves the visitor's input and offers retry/direct email. An already-saved submission is reused on retry, with the same Resend idempotency key; a new message gets a new key. Retries are limited to 23 hours (inside Resend's 24-hour idempotency window).

## Owner-only setup test before purchasing a domain

Resend permits the testing sender `onboarding@resend.dev` only when sending to the
email associated with that Resend account. Create the account using the portfolio
recipient address above if you want this restricted test. Use a private sending API
key as `RESEND_API_KEY` and `CONTACT_FROM_EMAIL=YKA <onboarding@resend.dev>` in the
ignored local environment and the Cloudflare **runtime** Variables and Secrets.
Never commit the key or put it in build variables. Do not treat this testing domain
as a permanent production sender; verify an owned domain before public deployment.
Apply the two contact migrations first. A real mailbox-delivery test is still
required after configuration; neither a passing unit test nor provider acceptance
means inbox delivery was observed.

### Current owner's setup (no purchased domain yet)

- The Resend account email and fixed recipient are both `yusufkerimaltay77@gmail.com`, so owner-only testing is appropriate.
- `workers.dev` belongs to Cloudflare. Do not enter it, `gmail.com`, a made-up domain, or the complete website URL into Resend's Domains form.
- In Resend **API Keys → Create API Key**, create a private **Sending access** key. For the owner-only test, do not restrict it to a nonexistent custom domain. Copy the key directly into your local `.env.local` and Cloudflare **Workers & Pages → yka-portfolio → Settings → Variables and Secrets** as `RESEND_API_KEY` (**Secret**). Do not send it in chat.
- In those same environments, set `CONTACT_FROM_EMAIL` to `YKA <onboarding@resend.dev>`. This sender is provided by Resend, not an invented address.
- Apply migrations 004 and 007 in that order using Supabase **SQL Editor → New query → Run**. These are already implemented in this repository; no additional schema is needed.
- Restart the local development server and deploy updated code after changing runtime settings. `npm run check:contact` must show both configuration fields present and database columns OK. It is not a delivery test.
- Send your own real message through `/tr/contact`. Check **Resend → Emails → Delivered** and your Gmail inbox/spam, then reply to confirm the visitor's address is used. Do not leave invented visitor records in the live database.
- Before relying on this as a permanent public sender, buy an owned domain, add it to **Resend → Domains**, and copy the exact required DNS records into **Cloudflare → your domain → DNS → Records** (not Workers variables). Wait for verification and change only `CONTACT_FROM_EMAIL` to an address at that verified domain. Do not invent DNS values or overwrite existing MX records.

Official references: [test-domain limits](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain), [domain verification](https://resend.com/docs/dashboard/domains/introduction).

## Security / maintenance

- Optional Cloudflare Turnstile is configured separately using the runtime variables `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. See [Turnstile setup](turnstile-setup.md). Both configured keys enforce server-side verification before database writes or email delivery; partial setup fails closed. Leaving both absent preserves the existing working setup during installation. The secret never reaches the browser.

- Server-side validation, bounded 32 KiB request bodies, same-origin checks, honeypot and minimum completion time.
- Persistent database rate limits: three new submissions per request fingerprint/hour, ten per email/day. Failed email retries do not consume another database submission. Forwarded IP headers must be overwritten by the trusted deployment proxy; do not trust arbitrary client-supplied headers on a custom host.
- Contact data remains behind the existing admin-only RLS policies. This migration adds no anonymous read policy and does not disable RLS.
- No user-entered HTML is executed in email. Provider errors/credentials and raw message data are not logged or returned to clients.
- Honeypots/time checks/rate limits reduce spam; they are not a CAPTCHA or a guarantee against all automated abuse. Monitor volume and add a managed challenge if abuse occurs.
- Database capture is durable, but there is no background email retry worker. A provider outage requires a visitor retry; saved messages remain accessible to authorized administrators in Supabase Table Editor.

Reference: [Resend send email API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [test-domain restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
