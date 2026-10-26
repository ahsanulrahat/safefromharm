# Release audit — 2026-10-25

**Branch:** `codex/admin-control-center`  
**Commit:** `21bbe51` plus 48 uncommitted paths (36 modified, 12 untracked)  
**Verdict:** **No-go for a production release of this branch.**

The branch is locally sound, but it cannot be released safely against the current
production deployment and database. Production is serving an older build on a
schema that lacks the control-center migrations. Deploying this code first would
break admin authentication.

## Blocking findings

1. **Production schema is four migrations behind.** The production database has
   `20261023141842_init`, `20261023203000_phone_unique_cert_active_key`,
   `20261025000000_add_audience`, and `20261025010000_archive_legacy_modules`.
   It does not have `20261026010000_admin_security`,
   `20261026020000_content_cms`,
   `20261026030000_pin_course_content_versions`, or
   `20261026040000_version_effective_pass_marks`. Its `AdminUser` table still
   lacks `loginId`, `isActive`, `mustChangePassword`, `sessionVersion`, and the
   other account/session fields. The branch's login query uses `loginId`, so the
   new code would fail against this schema.

2. **Production is not running this branch.** The production alias
   `https://scout-pi-snowy.vercel.app` returns 404 for `/en/admin/account` and
   `/en/admin/admins`, while `/en/admin/content` and `/en/admin/responses`
   redirect to login. This matches the older organizer build, not the
   control-center branch.

3. **Deployments are not traceable to Git.** The current Production and Preview
   deployments were built with the Vercel CLI and carry empty `VERCEL_GIT_*`
   metadata. A deployment cannot be matched to a commit, and branch-scoped
   Preview environment variables cannot be assumed to apply to a CLI build.
   Preview is SSO-protected (302 to `vercel.com/sso-api`), so the deployed
   Preview runtime could not be exercised anonymously.

4. **The work is uncommitted.** 48 paths are outside the last commit. The
   branch must be reviewed, committed, and pushed before it can be deployed
   reproducibly.

5. **Requested admin scope is still incomplete.** The registration-form
   builder, editable site/certificate settings, and object-storage upload flow
   are not implemented. The permission names (`registration:write`,
   `site_content:write`, `settings:read/write`) and a Preview
   `BLOB_READ_WRITE_TOKEN` exist, but no application code consumes them.
   Either finish this scope or explicitly descope it before calling the
   control center complete.

## Release gates that passed

| Check | Evidence |
| --- | --- |
| Translation parity | `npm run check:messages` — 576 keys in both locales |
| Lint | `npm run lint` — passed |
| TypeScript | `npm run typecheck` — passed |
| Unit tests | `npm test` — 108/108 passed across 7 files |
| Production build | `npm run build` — passed with the current source |
| Dependency audit | `npm audit --registry=https://registry.npmjs.org --audit-level=high` — 0 vulnerabilities |
| Admin end-to-end | 1/1 passed in 6.4 s against a local PostgreSQL database with all 8 migrations |
| Public route matrix | 83/83 passed earlier in the audit (bn/en, light/dark, 360 px overflow, serious/critical axe) |
| Learner journey | Rover registration → 3 modules → 15 answers → certificate → PDF → verification passed on the isolated Preview copy in about 7 minutes |
| Production health | `GET /api/health` — HTTP 200, database probe `ok` |
| Production home | `GET /` — HTTP 200 |
| Preview protection | Preview deployment returns 302 to Vercel SSO; Production alias is public |

The admin end-to-end run covered: seeded SUPERADMIN forced password change,
re-login, dashboard counts, account page, child `REPORTING_ADMIN` creation with a
one-time password, child forced password change, access denial on
`/admin/participants`, CSV export without reflection content, disabling the
child, and rejection of the revoked session on a protected route.

## Test-harness changes made during the audit

- Browser tests now require `PLAYWRIGHT_E2E_DATABASE_URL` and an exact
  `PLAYWRIGHT_E2E_DATABASE_HOST` match. `.env.local` is no longer loaded
  automatically, so a missing variable fails closed instead of silently
  targeting production.
- Added unit coverage for the database-target guard.
- Corrected three test-only assumptions in the admin spec: the post-password-
  change landing URL is `/admin`, the child page was on the public access-denied
  route rather than a protected one, and the disable form locator was
  double-scoped. No application behavior was changed for these.

## Data safety

- No production rows were created, changed, or deleted.
- The learner and admin browser runs used an isolated local PostgreSQL database
  with the full migration chain; the admin records were synthetic.
- Earlier Preview learner runs used QA-prefixed records and were cleaned up;
  the Preview QA participant count returned to zero.
- No production credentials were exported. Vercel intentionally withholds
  sensitive database values on `vercel env pull`; the audit did not attempt to
  bypass that boundary.

## Other release risks

- **Latency:** the same complete Rover journey took about seven minutes from
  this runner to the US-East Preview database, and individual server actions
  measured 11–18 seconds. The optimizations removed duplicate round trips, but
  network latency remains a launch risk. Measure from the organizers' expected
  region.
- **Sample content:** all three modules per audience are still marked SAMPLE and
  must be replaced with approved Bangladesh Scouts content.
- **Placeholders:** safeguarding contact, certificate signatory title, and the
  signature/logo assets still need organizer-approved values.
- **Seeded account:** the production SUPERADMIN must be replaced with an
  organizer-owned account and a rotated password.
- **Rate limiting:** without Upstash, limits are per instance.
- **Messaging:** email/SMS delivery is not configured.

## Not verified

- The deployed Preview runtime itself (blocked by Vercel SSO and withheld
  database secrets).
- Admin authentication against the production schema (blocked by the missing
  migrations; deliberately not attempted).
- A final four-scenario learner matrix on the optimized build. The four-scenario
  matrix passed on the prior build; the final optimized build was verified with
  one complete Rover journey.
- Fluent Bangla copy review.
- Any Git-hosted CI run. All evidence above is from this local checkout.

## Required sequence before production

1. Review and commit the branch; push it and let CI run.
2. Connect the Vercel project to GitHub so deployments carry a commit and
   branch-scoped Preview variables are real.
3. Back up the production Neon database, create a branch, apply all eight
   migrations, and run the admin + learner suites against that branch.
4. Decide whether the registration builder, site/certificate settings, and
   upload flow ship in this release. If not, descope them in the UI/docs and
   remove the unused Preview blob token.
5. Replace sample content and placeholders; confirm the signatory and
   safeguarding contact.
6. Deploy the matching commit to Preview, run the full matrix there, then
   promote to Production and re-check `/api/health`, admin login, registration,
   certificate issuance, and verification.
