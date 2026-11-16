# Portfolio content maintenance

## CV

Upload the PDF from **Admin → Resume → PDF upload**. The existing upload handler
validates a PDF, stores it in the `resume-public` Supabase Storage bucket and
updates `site_settings.resume_pdf_path`. Both languages and the footer use this
setting. The document is intentionally publicly downloadable, but is not a
source-code artifact. Keep PDFs, local import data and credentials out of Git.

The original CV was published with the owner's explicit approval on 2026-11-16.
Its public download was checked against the original bytes using SHA-256 before
the setting was updated. No bucket policies, authentication settings or contact
records were changed. If no CV is configured, do not display a dead local link.

## Views

Keep measurements in the project's admin fields, never hardcode the hero number.
The owner reported **19,500,000 X post impressions** for the existing 50 USDT
campaign publication on 2026-11-16. This replaces its old snapshot; it does not
create another publication or another metric to add. It was an owner-provided
update, not an independently audited video-play count.

The summary adds recorded publication snapshots with deduplication, distinguishes
X impressions from video plays, shows dates, and truncates to one decimal without
rounding up. Unknown counts remain unknown. The new Instagram video has no invented
view count. TR uses `19,5M`, EN uses `19.5M`; a plus denotes additional recorded views.

## Project copy

The owner confirmed concept/script, on-camera presentation, filming, editing and
publishing for the OKX TR, CryptOps and Smartup videos during this update. These
roles were added only to those video projects, not automatically to future work
or to website projects.

Seven former numbered placeholders were renamed after reading their public
Instagram captions. The new `De9VbLouGso` publication was identified as the OKX TR
Deposit and Earn campaign from its public account and caption. Campaign rewards
are descriptions of the campaign, not claimed results for the portfolio owner.
No conversion, revenue, customer acquisition or other business result was invented.

Existing project IDs, slugs, URLs, media settings and featured selections were
preserved. Existing skills were regrouped without deleting them. The contact
delivery and spam-protection implementation was left untouched.

## Remaining email setup

The currently working sender is still Resend's test sender. Do not change it
until ownership of the sending subdomain is verified in the existing Resend account.
See `contact-email-setup.md`. Never store provider keys in this documentation.
