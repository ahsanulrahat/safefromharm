# Route inventory

Bangla is the default locale and uses the unprefixed canonical paths. English uses the same paths under `/en`. Both locale families are served by the single `[locale]` App Router tree.

## Public pages

| Bangla (default) | English |
| --- | --- |
| `/` | `/en` |
| `/register` | `/en/register` |
| `/registered` | `/en/registered` |
| `/resume` | `/en/resume` |
| `/course` | `/en/course` |
| `/course/[moduleSlug]` | `/en/course/[moduleSlug]` |
| `/certificate` | `/en/certificate` |
| `/verify` | `/en/verify` |
| `/verify/[certId]` | `/en/verify/[certId]` |
| `/organizer/login` | `/en/organizer/login` |
| `/organizer` | `/en/organizer` |
| `/control-center` | `/en/control-center` |

`/organizer/login` is an alias for the administrator login. `/organizer` opens the organizer dashboard entry, and `/control-center` is retained as a legacy dashboard alias.

## Organizer/admin pages

These paths require an authenticated administrator and redirect unauthenticated visitors to the localized login page.

| Bangla (default) | English |
| --- | --- |
| `/admin/login` | `/en/admin/login` |
| `/admin` | `/en/admin` |
| `/admin/participants` | `/en/admin/participants` |
| `/admin/participants/[id]` | `/en/admin/participants/[id]` |
| `/admin/certificates` | `/en/admin/certificates` |
| `/admin/content` | `/en/admin/content` |
| `/admin/responses` | `/en/admin/responses` |
| `/admin/audit` | `/en/admin/audit` |

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
