# Privacy and responsive launch review

Implemented: versioned 180-day first-party consent cookie; optional preferences and external media default off; equal accept/reject options; editable/withdrawable choices; native accessible settings dialog; cross-tab updates; remote players and thumbnails blocked before consent, including X and the no-cover Instagram path. There is no separately installed analytics or advertising pixel. Theme localStorage is used only with preference consent. No fake analytics category or marketing checkbox was added.

Public pages: `/tr/privacy`, `/tr/cookies`, `/tr/terms`, and English counterparts. The contact form links to its notice before submission. Reading/receiving the notice is not bundled into a required marketing or blanket consent checkbox. The public website remains usable after rejection.

## Owner/legal review required before public launch

These notices describe inspected code, not a certification of legal compliance. Review with a qualified professional familiar with your actual operation:

- Confirm the controller identity/contact and an appropriate formal application channel/postal address where required. No address, company, registration number, DPO or regulatory exemption has been invented.
- Confirm the production domain, host, server/log regions and log retention. These cannot be established from local source code. Add the real host to the provider inventory where relevant.
- Review Supabase, Resend, Google and optional media-provider contracts, regions, subprocessors and the applicable international transfer mechanism under the current KVKK Article 9 regime. A cookie toggle, a GDPR DPA or a generic consent sentence alone is not a verified solution to international transfers.
- Determine and operate actual retention periods, review/deletion procedures, backup handling and data-subject request handling. No automatic contact deletion exists and no historical data was deleted by this change. The notices state retention criteria rather than inventing a fixed purge period.
- Assess the appropriate legal basis for each contact purpose and whether requiring a phone number is necessary/proportionate for your process. It is currently required at the owner's explicit request.
- Confirm you have the necessary permission to publish the CV, client videos, logos, music and personal information appearing in portfolio assets. No blanket copyright ownership claim was made.
- Review requirements for your actual target territories (including whether EU/UK rules apply). No universal GDPR/KVKK compliance badge, fictitious certification, ecommerce return policy or sales contract was added to this non-selling portfolio.
- Test production consent on the final host. Choices are stored client-side, not in a server-side audit/CMP database. If consent proof requirements demand an audit record, select a compliant implementation with counsel; this implementation does not claim to supply one.
- Revoking media consent unmounts players and prevents new loads. Already-transmitted information and provider cookies are outside the site's control; the settings explain browser/provider cleanup.

## Operational dependencies not changed here

Email is not verified live until Resend is configured and delivered email is tested. See `docs/contact-email-setup.md`. Phone storage requires `supabase/migrations/202610160007_contact_phone.sql`. These changes do not create credentials, alter authentication or disable RLS.

Follow-up security update on 2026-10-16 applied compatible Next.js 16.3.8, sharp and transitive package patches. Production dependency audit now reports 0 findings; the full audit retains 5 high findings from an upstream-unpatched development lint chain. See `docs/security-update-20261016.md` for exact scope, residual risk and verification. A passing build or production dependency audit is not a complete security certification.

## Primary references checked

- [KVKK cookie guidance](https://www.kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber)
- [Duty to inform](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
- [Data-subject rights](https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari)
- [Requests](https://www.kvkk.gov.tr/Icerik/2062/Basvuru-Hakki)
- [International transfers](https://www.kvkk.gov.tr/Icerik/8143/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi)

Prefer changing `lib/privacy/notices.ts` and incrementing `CONSENT_VERSION` when consent scope changes. Re-run responsive/privacy tests after adding any new embed, font CDN, analytics or advertising script.
