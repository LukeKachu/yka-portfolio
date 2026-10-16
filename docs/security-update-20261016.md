# Security update — 2026-10-16

## Scope and result

The starting npm audit reported 9 package findings: 1 critical and 8 high. Applied compatible patches without a framework-major migration, database changes, admin account changes or service-role credentials:

- Next.js / eslint-config-next: 16.3.3 → 16.3.8; keep the 16.3 patch line (`~16.3.8`).
- sharp: 0.35.4 → 0.35.5.
- source-map-js: 1.2.1 → 1.2.2.
- brace-expansion: 1.1.18 → 1.1.21 and 5.0.9 → 5.0.12.
- Lockfile records the tested package versions. No `npm audit fix --force`, fabricated patch, dependency alias/fork or major downgrade was used. Installation scripts were not enabled for the update; the build and native image processing tests verify the installed binaries work.

`npm audit --omit=dev` reports **0 findings** after the update. Full `npm audit` still reports **5 high findings**, all from the unpatched development dependency chain `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3`. The upstream advisory lists no patched braces version. These dependencies are used by the linter, not exposed by the portfolio's browser/API routes. Do not feed untrusted glob patterns to development tools, and recheck this chain when an upstream fix is available. This is documented residual risk, not a clean full audit.

## Baseline response hardening

Configured no MIME sniffing, same-origin framing, restricted cross-origin referrers, disabled unused device permissions, and removed the framework-identifying response header. The CSP constrains base URLs, plugin objects, framing and HTML form actions. It intentionally does not claim to be a complete nonce-based script/XSS policy; a stricter policy needs separate compatibility testing for Next.js and external players.

No HSTS preload/subdomain policy was invented before a production HTTPS host exists. Existing authorization (`admin_users` + `is_admin()`), RLS and credentials remain unchanged. Anonymous admin entry points are covered by redirect tests. Public external players remain consent-gated.

## Local testing and brand assets

- The development server was restarted with the patched Next.js version, bound to loopback.
- The LAN preview helper is opt-in, uses a production build and binds only a selected local private IPv4 address. Its read-only `--check` does not open a listener. It does not alter firewall/router configuration or create a tunnel/cloud deployment.
- Contact request identifiers use cryptographically random UUIDv4 bytes from `getRandomValues`, which also works in local-network HTTP contexts; no insecure `Math.random` fallback was added. HTTP is still unsuitable for admin passwords or sensitive personal data.
- Three vector-native favicon drafts were prepared. The user selected **03 / Editorial**, which is now the source for the SVG/ICO/Apple icon. Draft comparisons remain in `design/favicon/`.

## Primary references

- [Next.js ImageResponse advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j)
- [sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w)
- [Unpatched braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [Web Crypto getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)

This dependency/hardening check is not a complete penetration test, legal certification or guarantee against all vulnerabilities.

## Subsequent Cloudflare preparation

The later GitHub/Workers setup updated Next.js and eslint-config-next to pinned 16.4.1 for compatibility with OpenNext 1.20.12 / Wrangler 4.151.1. This supersedes the earlier 16.3 patch-line pin above. No authentication or database model was changed. A scoped override updates only `@node-minify/core`'s `glob` dependency from 10.3.3 to 10.5.0 to address its reported command-injection advisory; no framework downgrade or `audit fix --force` was used. The development linter's unpatched braces chain remains a disclosed residual risk.

OpenNext's Node.js proxy integration is experimental. Builds passing is not a support guarantee; see `docs/cloudflare-deployment.md` before making a production decision. The release command also refuses generated artifacts containing known private/import credentials from local environment files; production releases must use a clean Git build and Dashboard runtime secrets.
