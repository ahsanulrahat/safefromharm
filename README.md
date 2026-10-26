# Scout Moot 2026 — Safe from Harm

A mobile-first online safeguarding course for Scout Moot 2026 participants, with
passwordless registration, a video + MCQ + reflection course, a verifiable PDF
certificate, and an organizer dashboard.

Built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL
(Neon in production) and Auth.js.

> **Sample content:** the three seeded modules are placeholders marked
> `SAMPLE — replace with official Bangladesh Scouts Safe from Harm content.`
> They are **not** official policy text. Replace them in the admin content
> editor before launch.

## Features

### Participants

- Register without a password using Scout ID plus phone or email.
- Duplicate registration blocked by Scout ID and phone (database constraints).
- Guardian consent required for participants under 18.
- Bangla (default) and English, with Noto Sans Bengali.
- Resume with a code, resume link, or Scout ID + phone/email.
- DB-driven modules: YouTube video, MCQ steps, and free-text reflections.
- Video unlocks steps after playback ends, with an accessible "I watched it"
  fallback.
- Configurable MCQ pass mark (default 70%, per-module override supported).
- Server-validated reflections with a configurable minimum word count
  (default 30 words).
- Progress saves after each step and resumes where the participant left off.
- Completion is recalculated and verified on the server.
- Verifiable digital certificate (PDF with QR code) and a public
  `/verify/[certId]` page that shows only name, course, issue date and status.

### Organizers

- Credentials login for admins (`SUPERADMIN`, `SAFEGUARDING`, `VIEWER`).
- Dashboard: totals, 30-day registrations, district/unit/section breakdowns and
  a per-module funnel.
- Participant list with search, filters, pagination and CSV export.
- Participant detail with module progress and certificate history.
- Certificates: revoke with a reason, re-issue with a new ID.
- JSON content editor with schema validation, reordering and publish toggles.
- Reflection answers visible only to `SUPERADMIN` and `SAFEGUARDING`, with
  every page view written to the audit log.
- Audit log for sensitive actions, visible to `SUPERADMIN`.

### Privacy and security

- Only the fields needed for the course are collected.
- Privacy notice and explicit consent before registration.
- Reflection answers are encrypted at rest with AES-256-GCM, with the key
  derived from `AUTH_SECRET`.
- Reflections are never shown on public pages and never included in CSV
  exports.
- Admin sessions are JWT-based and separate from participant sessions.
- Rate limiting on registration, resume and admin login (Upstash Redis when
  configured, in-memory fallback otherwise).
- Security headers and a restrictive CSP (YouTube is the only third-party
  frame/script).
- No secrets are committed; `.env` is gitignored.

## Local development

Requirements: Node.js 20+, PostgreSQL 14+.

```bash
npm install
cp .env.example .env
# edit .env with your local database and a random AUTH_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000 (redirects to `/bn`).

Useful commands:

```bash
npm run test         # unit tests (completion rules, certificate IDs)
npm run lint
npm run typecheck
npm run build
npm run db:studio    # Prisma Studio
```

### Browser tests

`npm run test:e2e` refuses to start unless `PLAYWRIGHT_E2E_DATABASE_URL` and
`PLAYWRIGHT_E2E_DATABASE_HOST` point to a disposable database. There is no
production default and `.env.local` is not loaded automatically. Use a Neon
branch or a local PostgreSQL database migrated with `prisma migrate deploy`;
never point these variables at production.

The admin diagnostic spec additionally requires the local-only `AUDIT_*`
values and a seeded `SUPERADMIN` account with a forced first password change.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled PostgreSQL connection used at runtime |
| `DIRECT_URL` | yes | Direct connection used by Prisma migrations |
| `AUTH_SECRET` | yes | Admin sessions, participant cookies, reflection encryption |
| `NEXT_PUBLIC_SITE_URL` | yes | Public origin used in certificate QR/verify links |
| `ADMIN_EMAIL` | seed | Email for the seeded `SUPERADMIN` |
| `ADMIN_PASSWORD` | seed | Password for the seeded `SUPERADMIN` |
| `SAFEGUARDING_CONTACT` | yes | Contact shown in the safeguarding box on every page |
| `UPSTASH_REDIS_REST_URL` | optional | Upstash rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | optional | Upstash rate limiting |

> Changing `AUTH_SECRET` invalidates participant sessions and admin sessions,
> and makes previously encrypted reflections unreadable.

## Content management

1. Open the organizer dashboard at `/bn/organizer` (or `/bn/admin`), then sign
   in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Open **Content** and select a module (or create a new one).
3. Edit the JSON and save. The schema is validated server-side before writing.
4. Replace every `SAMPLE` module with approved Bangladesh Scouts Safe from Harm
   content, then keep the modules published.

Step IDs are stable: keep existing IDs when editing so participant progress is
preserved. New steps can omit `id`.

The default pass mark is stored in the `Setting` table (`mcqPassMark`) and can
be changed in the content page. A module can override it with its own
`passMark`.

## Certificates

The certificate design lives in `src/lib/certificate.ts` (provided design,
unchanged in structure). It loads optional PNG assets from `public/`:

- `public/signature-abm-abdus-sattar.png` — signature image
- `public/scout-logo.png` — event or organization logo

Both are optional at runtime: if a file is missing, the certificate is still
generated without it. **Do not fabricate a signature or logo.** Add the real
files when the organizers provide them.

The signatory title in `CONFIG.signatoryTitle` is a placeholder and must be
confirmed with the organizers before launch.

## Deployment (Vercel + Neon)

Current Vercel project: `ahsanulrahats-projects/scout`.

- Production alias: https://scout-pi-snowy.vercel.app
- Health check: https://scout-pi-snowy.vercel.app/api/health
- Preview deployments are protected by Vercel SSO.
- Production currently runs the pre-control-center build. The
  `codex/admin-control-center` branch requires four additional database
  migrations and has not been released. See
  [docs/RELEASE-AUDIT.md](docs/RELEASE-AUDIT.md) for the evidence and blockers.
- Deployments created with the Vercel CLI carry no Git commit metadata. Until
  the GitHub repository is connected to the Vercel project, a deployment cannot
  be traced to a commit or assumed to use branch-scoped Preview variables.

### Reproducing the deployment

1. Create a Neon project and copy the **pooled** and **direct** connection
   strings, or install the Neon integration from the Vercel Marketplace.
2. Push this repository to GitHub and import it into Vercel, or deploy with the
   Vercel CLI.
3. Add all environment variables from `.env.example` to Vercel
   (Production and Preview as appropriate). Set `NEXT_PUBLIC_SITE_URL` to the
   production domain. With the Neon integration, `DATABASE_URL` is provided;
   set `DIRECT_URL` to the unpooled connection string.
4. Run migrations against Neon from a trusted machine:

   ```bash
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:seed
   ```

5. Deploy. Check `/api/health`, register a test participant, complete the
   course, download the PDF and open the verification page.
6. Optionally configure Upstash Redis for production rate limiting.

### Smoke-test checklist

- [ ] `/bn` and `/en` load and the language switcher works.
- [ ] Registration rejects a duplicate Scout ID and duplicate phone.
- [ ] Under-18 registration requires guardian consent.
- [ ] Resume code, resume link, and Scout ID + contact all work.
- [ ] Video completion unlocks the questions; "I watched it" also works.
- [ ] Reflections shorter than the minimum are rejected.
- [ ] Completing all modules issues exactly one active certificate.
- [ ] Certificate PDF downloads and the QR link opens `/verify/[certId]`.
- [ ] Revoked certificates show as revoked and return HTTP 410 from the PDF API.
- [ ] Admin dashboard counts match registrations.
- [ ] CSV export works and contains no reflection answers.
- [ ] `VIEWER` cannot open responses or the audit log.
- [ ] `SAFEGUARDING` can read responses and the access appears in the audit log.
- [ ] `/api/health` returns `ok`.

## Known gaps / launch TODOs

- Replace the three SAMPLE modules with official Safe from Harm content.
- Replace the placeholder `SAFEGUARDING_CONTACT` in Vercel before launch.
- Replace the seeded `admin@example.org` account with an organizer-owned email
  and rotate the generated password.
- Connect the GitHub repository to the Vercel project for Git-based deploys and
  previews. CLI deployments currently have no Git metadata and cannot be
  matched to a commit.
- Apply the four control-center migrations to a backed-up Neon branch, verify
  them there, and only then deploy the matching code to production. Deploying
  the branch against the current production schema would break admin login.
- Finish or explicitly descope the registration-form builder, editable
  site/certificate settings, and object-storage upload flow. The permissions and
  `BLOB_READ_WRITE_TOKEN` exist, but no application code uses them yet.
- Confirm A B M Abdus Sattar's official designation and update
  `CONFIG.signatoryTitle`.
- Add the real signature and logo PNGs to `public/`.
- Configure Upstash Redis (otherwise rate limits are per instance).
- Email/SMS delivery is not configured; registration shows the resume code on
  screen instead of sending it.
- The public privacy notice is inline in the registration page; have it
  reviewed by the organizers before launch.
- Remote database latency is a release risk: a complete Rover journey took
  about seven minutes against the US-East Preview branch, and individual saves
  took 11–18 seconds from the audit location. Measure from the organizers'
  expected region before launch.
- Automated browser coverage exists (`e2e/`), but it must be run against a
  disposable database and a locally built production server, not production.
