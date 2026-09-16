# Phase 5: Release validation — TDD evidence

## Source plan

[Implementation execution plan](/_ProjectDocs/implementation_execution_plan.md), Phase 5.

## User journeys

1. As a reader, I can use every screen with the keyboard alone — including the display-settings drawer, which traps focus, closes on Escape, and returns focus to its trigger.
2. As a reader with low vision, every text/background combination in both light and dark themes meets WCAG AA contrast, verified by an automated axe audit.
3. As a mobile reader on a slow connection, the app hydrates and paints fast (TBT and LCP within budget) because analytics never competes with first paint.
4. As an installed PWA user, every client-side navigation prefetch resolves (no console errors) and the app stays inside the release JS budget on every route.
5. As an operator, I can rehearse a Netlify rollback (publish an earlier deploy, verify critical flows, re-enable auto publishing) using the documented runbook.

## RED → GREEN evidence

| Behaviour | RED evidence | GREEN evidence |
| --- | --- | --- |
| WCAG AA contrast on tool badges/buttons in both themes | `npm.cmd run test:e2e -- e2e/phase-5-release.spec.ts` axe scan failed on `/alatan/` (light): color-contrast **serious** — `.tool-sequence span { color: var(--muted) }` (specificity 0-1-1) overrode `.tool-active-badge`'s white-on-brand color; latent dark-theme failures (white on mint/`#f87171`) were found by the same scan pattern. | Same suite passes after adding theme-aware `--brand-contrast`/`--danger-contrast` tokens (light `#ffffff`, dark `#10201c`) and a `.tool-sequence .tool-active-badge` specificity fix; all axe scans report 0 violations. |
| Display drawer is a real modal for keyboard users | E2E failed: opening the drawer did not move focus into it, and Tab was not trapped. | Focus lands on the first pill, Tab/Shift+Tab wrap within the dialog, Escape closes and restores trigger focus; suite passes. |
| Modal overlays the whole page (code review HIGH) | Review finding: drawer portal lived inside `.sticky-reader-toolbar` (z-index 45), so the bottom nav (z-index 50) painted above the backdrop and stayed clickable under `aria-modal`. | Drawer renders via `createPortal(…, document.body)`; bottom nav is no longer reachable while the modal is open. |
| Client-side navigation prefetches resolve on a static host | E2E failed and Lighthouse "Errors logged to console" scored 0: router requested flattened dotted RSC payloads (`/route/__next.<segs>.__PAGE__.txt`) which 404'd — Next.js 16 static export emits nested directories instead ([vercel/next.js#85374](https://github.com/vercel/next.js/issues/85374)). | `scripts/fix-static-export-rsc.mjs` publishes 26 flattened payloads alongside the nested originals; the E2E payload test (6 routes) passes and the console is clean. |
| First-load JS stays within budget and hydration is fast | Lighthouse reported TBT 800 ms on home (GA + Clarity loading eagerly). | Analytics deferred to `lazyOnload` (events queue on `window.dataLayer`); TBT 290 ms. `scripts/check-bundle-budget.mjs` now gates the build: all 28 routes ≤ 300 KB gzipped JS (worst: `/alatan` 293.6 KB). |

## Guarantees

| # | What is guaranteed | Test / command | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | All 19 guides are frozen as approved content with reviewer provenance, and the needs-review sample is excluded from canonical discovery. | `test/phase-5-release.test.mjs` | Unit / contract | PASS |
| 2 | Zero axe violations (WCAG 2.0/2.1/2.2 A+AA tags) on 6 light-theme routes, 3 dark-theme routes, and 2 mobile-viewport routes. | `e2e/phase-5-release.spec.ts` | E2E / a11y audit | PASS |
| 3 | Keyboard users can fully operate the display drawer (focus trap, wrap, Escape, focus restore) and reach the primary guide from home via Tab only. | `e2e/phase-5-release.spec.ts` | E2E | PASS |
| 4 | Every RSC page payload the client router prefetches returns 200 on the static export. | `e2e/phase-5-release.spec.ts`, `scripts/fix-static-export-rsc.mjs` in the build chain | E2E / build | PASS |
| 5 | Every published route loads at most 300 KB gzipped JavaScript; the build fails otherwise. | `npm.cmd run build` (`scripts/check-bundle-budget.mjs`) | Build gate | PASS (28 routes; worst 293.6 KB) |
| 6 | Host security headers (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS, manifest content type) and the apex 301 redirect are declared for deployment. | `test/phase-5-release.test.mjs` against `netlify.toml` | Contract | PASS |
| 7 | PWA surfaces are intact: maskable manifest icons exist, robots.txt points at the apex sitemap, sitemap lists every approved guide, the offline fallback route publishes. | `e2e/phase-5-release.spec.ts` | E2E | PASS |
| 8 | The service worker precaches the full release surface with content-revisioned cache names. | `npm.cmd run build` (worker output) | Build | PASS (198 URLs) |
| 9 | A Netlify rollback can be rehearsed without guessing: publish-earlier-deploy flow, critical-flow checklist, deploy lock, and evidence to record. | [Deployment guideline §9.4](../deployment-guideline-solat-wiki-netlify-cloudflare.md) | Runbook | Documented |

## Final validation

- `npm.cmd run lint` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd test` — PASS (67 tests)
- `npm.cmd run build` — PASS; 26 flattened RSC payloads, 198-URL precache, bundle budget green for 28 routes (worst `/alatan` 293.6 KB of 300 KB).
- `npm.cmd run test:e2e` — full suite (phases 1–5 + brand/favicon) PASS.
- Accessibility — axe-core 4.13 (`@axe-core/playwright`), tags wcag2a/2aa/21a/21aa/22a/22aa: 0 violations across light, dark, and mobile-viewport scans.
- Lighthouse (local lab, simulated mobile throttling, HTTP/1.1 `serve`): home perf **86** (TBT 290 ms, LCP ~3.2 s, CLS 0.075), reader perf **81–86** (LCP 3.1 s, CLS 0.001); a11y **100**, SEO **100**, best-practices **77**.
- Device/browser matrix: Chrome (system) desktop + 375×812 mobile emulation, light and dark themes; E2E runs the same flows in both viewports.

## Release review notes and known limitations

- **LCP vs field target:** lab LCP (3.1–3.2 s) exceeds the plan's 2.5 s field target, but the local profile is worst-case (unoptimised HTTP/1.1 server + simulated slow 4G). Production Netlify (HTTP/2 + brotli + CDN) is expected to land under target; verify with CrUX field data post-launch. Amiri font preload on reader pages is the first optimisation lever if needed.
- **Best-practices 77:** the only deduction is Microsoft Clarity's third-party cookies — a product decision (session analytics); revisit if a cookieless option is required.
- **CSP:** not yet enabled; a static-export-friendly policy (Netlify header or meta CSP) is the recommended follow-up alongside the existing header set.
- **Sign-off remaining:** release owner and religious reviewer sign-off (per plan exit gate). Content is verified frozen programmatically (19/19 approved with reviewedBy/lastReviewedAt/contentVersion).