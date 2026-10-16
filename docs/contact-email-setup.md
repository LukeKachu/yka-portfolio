# Contact form delivery

The form sends to **yusufkerimaltay77@gmail.com**. Name, email, phone, subject and message are included. The visitor's email is `Reply-To`; it must not be used as the sender because it would fail domain authentication.

## One-time configuration

1. In Supabase SQL Editor, run `supabase/migrations/202608300004_contact_messages.sql` if not already applied, then `supabase/migrations/202610160007_contact_phone.sql`. Both are additive and re-runnable; existing messages are preserved. No service-role credential is needed.
2. In [Resend Domains](https://resend.com/domains), add a domain you own and add the DNS records Resend provides. Wait until the domain is verified. Do not invent DNS values. A Gmail address cannot be used as your verified sending domain.
3. In [Resend API Keys](https://resend.com/api-keys), create a sending-only key restricted to that domain. Keep it private.
4. Set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` in the ignored root `.env.local`. The sender format is `YKA <address@your-verified-domain>` (use your actual address, not this placeholder). Configure the same variables on the production host. Never prefix these with `NEXT_PUBLIC_`. Restart the development server / redeploy after configuration.
5. Run `npm run check:contact`. This is read-only and checks configuration and the database columns without printing secrets. It does not claim an email was delivered.
6. Submit one genuine enquiry through `/tr/contact` with a reachable reply address and phone number. In Resend **Emails**, verify its status is **Delivered**, then check the recipient's inbox/spam. Reply to confirm `Reply-To`. An API acceptance alone does not guarantee inbox placement.

Until email configuration exists, the page clearly offers direct email instead of accepting a message and falsely claiming delivery. After configuration, a provider failure preserves the visitor's input and offers retry/direct email. An already-saved submission is reused on retry, with the same Resend idempotency key; a new message gets a new key. Retries are limited to 23 hours (inside Resend's 24-hour idempotency window).

## Security / maintenance

- Server-side validation, bounded 32 KiB request bodies, same-origin checks, honeypot and minimum completion time.
- Persistent database rate limits: three new submissions per request fingerprint/hour, ten per email/day. Failed email retries do not consume another database submission. Forwarded IP headers must be overwritten by the trusted deployment proxy; do not trust arbitrary client-supplied headers on a custom host.
- Contact data remains behind the existing admin-only RLS policies. This migration adds no anonymous read policy and does not disable RLS.
- No user-entered HTML is executed in email. Provider errors/credentials and raw message data are not logged or returned to clients.
- Honeypots/time checks/rate limits reduce spam; they are not a CAPTCHA or a guarantee against all automated abuse. Monitor volume and add a managed challenge if abuse occurs.
- Database capture is durable, but there is no background email retry worker. A provider outage requires a visitor retry; saved messages remain accessible to authorized administrators in Supabase Table Editor.

Reference: [Resend send email API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [test-domain restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
