# Quality and Flow Audit — 2026-10-25

## Changes made

- Added under-18 and guardian-consent controls to the registration form. The
  existing server validation remains authoritative and rejects a minor's
  registration until guardian consent is checked.
- Added registration validation tests for adult registration, minor consent,
  contact details, and privacy consent.
- Updated Vitest to 4.1.12 to resolve the flagged test-runner vulnerabilities,
  and renamed the config to `.mts` to remove the module-loader warning.
- Replaced raw exception logging in registration, progress, certificate,
  admin-content, audit, and health paths with non-sensitive error metadata.

## Verification evidence

| Check | Result |
| --- | --- |
| `npm ci` | Passed; lockfile is reproducible |
| `npm test` | Passed: 16 tests across 3 files |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; 37 routes built |
| Production health | HTTP 200; database probe returned `ok` |
| Bangla and English registration pages | Both returned HTTP 200; both show the age and guardian-consent fields |
| Mobile layout at 390 × 844 | Registration and public verification pages had no horizontal overflow |
| Admin sign-in | Production credentials accepted; dashboard displayed 6 participants, 3 completions, 3 active certificates, and 0 revoked certificates |

## Production end-to-end runs

Used synthetic `QA-E2E-*` accounts for both ROVER and LEADER, then verified
registration, course unlocks, all three modules per audience, 12 MCQ answers,
three reflections, certificate issuance, and the public verification page.
Each track produced one active certificate. Both PDF endpoints returned HTTP
200 with `application/pdf` content and valid PDF 1.7 files. The minor
registration attempt was rejected until guardian consent was recorded.

After verification, both synthetic participants and their related progress
and certificates were removed through the participant cascade. A database
check confirmed neither QA Scout ID remains; production returned to 6
participants.

## Remaining findings

- `npm audit --registry=https://registry.npmjs.org --audit-level=high` still
  reports three high-severity findings in `deepmerge-ts`, brought in by the
  Prisma 6 CLI/config package. Prisma 6.19.3 is the current project major; the
  available fix requires a Prisma major upgrade. No unverified transitive
  override was added.
- The seeded curriculum is explicitly marked as sample content, and the
  safeguarding contact currently displays a placeholder. Replace both with
  organizer-approved content before treating the course as official.
- Vercel marks production secrets as encrypted; CLI environment pulls redact
  them. The production environment was configured from the repository's
  Neon/app settings and exercised through live database and login requests.
- `AUTH_SECRET` was set from the repository's configured value while restoring
  the production environment. Vercel does not reveal the prior encrypted value,
  so old participant/admin cookies may need to be renewed; saved participant
  progress remains in the database.
