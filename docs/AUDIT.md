# Quality and repair audit

> Historical record from an earlier build. Current release evidence and blockers are in [RELEASE-AUDIT.md](RELEASE-AUDIT.md).

## Issues fixed

- Locale negotiation previously redirected the Bangla root back to itself. Default Bangla routes now resolve without a prefix, English stays under `/en`, and the locale proxy excludes API/framework/static paths.
- Direct locale-prefixed links and server redirects could send visitors to non-canonical paths. Shared locale-aware paths now preserve the active language, and the language control keeps the current path and query.
- The admin dashboard did not consistently expose locale/theme controls, while unauthenticated dashboard routes needed a server-side access check. Controls are now shared in the admin chrome and protected layouts require an authenticated admin.
- Dark surfaces, chart colors, focus/status colors, and certificate presentation were inconsistent. Shared theme tokens now cover both modes; charts use CSS variables and certificate previews remain light.
- Bangla registration IDs and phone digits were rejected by ASCII-only validation. Inputs are normalized before validation.
- Localized content could be blank when only one language was filled. Pages now fall back to the available translation and the organizer editor flags missing translations.
- Missing translation parity was not checked during builds. `prebuild` now verifies matching, non-empty message keys.
- The Bangla font stylesheet referenced a missing asset. A locally served Siyam Rupali font and its GPL license are included.
- Course reflection translation calls omitted interpolation values and raised runtime formatting errors. Calls now supply the expected values.
- Certificate verification links now use the locale-neutral verification path.
- A localized route error boundary now provides retry and home navigation.

## Verification run

- Translation parity: `npm run check:messages` — 458 keys in each locale.
- Lint: `npm run lint` — passed.
- Typecheck: `npm run typecheck` — passed.
- Unit tests: `npm test` — 17 passed.
- Theme/locale route matrix: 83 Playwright checks passed against the optimized local production server, including 360px overflow and serious/critical axe checks.
- Production build: `npm run build` — passed after the localized error boundary and translation updates.
- Full registration, learning, assessment, certificate download, and verification flow: 4 Playwright scenarios passed against the optimized local production server (Rover and Leader in bn/light and en/dark).
- Synthetic local QA participants were removed after the flow checks; no certificates remained.

## Remaining content review

A fluent Bangla reviewer should review the translated UI. The course content is explicitly marked as sample material until official Bangladesh Scouts content is supplied in both languages.
