# Privacy and responsive launch review

Owner-requested display mode: external players are visible by default, with lazy loading for off-screen cards and autoplay disabled on first load. There is no automatic permission banner. Optional theme storage remains off until an explicit choice; declining theme storage does not hide videos. The footer dialog independently controls saved theme and video visibility. No first-party preference cookie is written merely by visiting. Saved choices use the existing 180-day version-1 record for compatibility, not as proof of media consent. Existing valid explicit media opt-outs are preserved server-side before any player HTML is emitted, avoiding a hydration-time leak. A scoped play click can override an opt-out for one mounted player without persistent consent or enabling other players. Subsequent preference changes clear that request, including cross-tab changes.

**Not a consent-compliant default-off media mode:** visible third-party embeds may receive IP/device information, set their own cookies and track before an explicit action. Neither YouTube nocookie nor X dnt proves otherwise. Calling a display toggle “consent” or classifying all social tracking as essential would be misleading. Review this requested configuration with a qualified privacy professional, including the provider-specific legal bases and international transfers; a privacy notice or opt-out toggle alone does not establish those bases. For immediate video display without social embeds, the alternative is publishing authorized video files through a first-party delivery workflow. No separately installed analytics/advertising pixel has been added, but this does not imply embedded providers cannot track.

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
- Saving video visibility off unmounts players and prevents new loads. Already-transmitted information and provider cookies are outside the site's control; the settings explain browser/provider cleanup.

## Operational dependencies not changed here

Email is not verified live until Resend is configured and delivered email is tested. See `docs/contact-email-setup.md`. Phone storage requires `supabase/migrations/202610160007_contact_phone.sql`. These changes do not create credentials, alter authentication or disable RLS.

Follow-up security update on 2026-10-16 applied compatible Next.js 16.3.8, sharp and transitive package patches. Production dependency audit now reports 0 findings; the full audit retains 5 high findings from an upstream-unpatched development lint chain. See `docs/security-update-20261016.md` for exact scope, residual risk and verification. A passing build or production dependency audit is not a complete security certification.

## Primary references checked

- [KVKK cookie guidance](https://www.kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber)
- [Duty to inform](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
- [Data-subject rights](https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari)
- [Requests](https://www.kvkk.gov.tr/Icerik/2062/Basvuru-Hakki)
- [International transfers](https://www.kvkk.gov.tr/Icerik/8143/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi)

Update `lib/privacy/notices.ts` with behavior changes. This display-mode change deliberately retains the existing record version to respect valid prior media opt-outs; do not invalidate them by bumping the version just to enable players. Re-run responsive/privacy tests after adding any new embed, font CDN, analytics or advertising script.
