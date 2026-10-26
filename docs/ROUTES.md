# Route inventory

English is the default locale and uses the unprefixed canonical paths. Bangla uses the same paths under `/bn`. Both locale families are served by the single `[locale]` App Router tree.

## Public pages

| English (default) | Bangla |
| --- | --- |
| `/` | `/bn` |
| `/register` | `/bn/register` |
| `/registered` | `/bn/registered` |
| `/resume` | `/bn/resume` |
| `/course` | `/bn/course` |
| `/course/[moduleSlug]` | `/bn/course/[moduleSlug]` |
| `/certificate` | `/bn/certificate` |
| `/verify` | `/bn/verify` |
| `/verify/[certId]` | `/bn/verify/[certId]` |
| `/organizer/login` | `/bn/organizer/login` |
| `/organizer` | `/bn/organizer` |
| `/control-center` | `/bn/control-center` |

`/organizer/login` is an alias for the administrator login. `/organizer` opens the organizer dashboard entry, and `/control-center` is retained as a legacy dashboard alias.

## Organizer/admin pages

These paths require an authenticated administrator and redirect unauthenticated visitors to the localized login page.

| English (default) | Bangla |
| --- | --- |
| `/admin/login` | `/bn/admin/login` |
| `/admin/first-login-password` | `/bn/admin/first-login-password` |
| `/admin/access-denied` | `/bn/admin/access-denied` |
| `/admin` | `/bn/admin` |
| `/admin/account` | `/bn/admin/account` |
| `/admin/admins` | `/bn/admin/admins` |
| `/admin/participants` | `/bn/admin/participants` |
| `/admin/participants/[id]` | `/bn/admin/participants/[id]` |
| `/admin/certificates` | `/bn/admin/certificates` |
| `/admin/content` | `/bn/admin/content` |
| `/admin/responses` | `/bn/admin/responses` |
| `/admin/audit` | `/bn/admin/audit` |

## API and framework routes

| Path | Purpose |
| --- | --- |
| `/api/admin/export` | Administrator CSV export |
| `/api/auth/[...nextauth]` | NextAuth endpoints |
| `/api/certificate/[id]` | Certificate PDF download |
| `/api/health` | Health check |
| `/r/[code]` | Resume-code redirect |
| `/robots.txt` | Robots metadata |
| `/sitemap.xml` | Sitemap metadata |
| `/favicon.ico` | Site icon |

Next.js internals, API endpoints, resume-code redirects, and paths containing file extensions are excluded from locale negotiation.
