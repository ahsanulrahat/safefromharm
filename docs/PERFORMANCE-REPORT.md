# Production Performance Snapshot — 2026-10-25

Single-request `curl` measurements against `https://scout-pi-snowy.vercel.app`
after the production release. Times are elapsed seconds from this client; they
are a smoke snapshot, not a Lighthouse or field-user study.

| Route | HTTP | TTFB | Total | Response bytes |
| --- | ---: | ---: | ---: | ---: |
| `/` | 307 redirect to `/bn` | 0.178 s | 0.178 s | 15 |
| `/bn/register` | 200 | 0.179 s | 0.211 s | 91,528 |
| `/en/register` | 200 | 0.624 s | 0.645 s | 66,820 |
| `/bn/admin/login` | 200 | 0.396 s | 0.599 s | 65,177 |
| `/api/health` | 200 | 0.540 s | 0.540 s | 70 |

The health route performs a PostgreSQL `SELECT 1`. Browser viewport checks at
390 × 844 found no horizontal scrolling on the Bangla registration or public
certificate-verification pages. The production build completed on Vercel and
served all checked routes successfully.
