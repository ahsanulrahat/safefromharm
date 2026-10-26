# Admin permissions

Admin authorization is checked on the server for every page, Server Action and admin API route. Navigation visibility is only a usability aid. `src/lib/roles.ts` is the source of truth; `src/lib/roles.test.ts` covers every role/permission pair.

| Permission | SUPERADMIN | CONTENT_MANAGER | SAFEGUARDING_REVIEWER | REPORTING_ADMIN |
| --- | --- | --- | --- | --- |
| Dashboard and aggregate metrics | Yes | — | Yes | Yes |
| Participant roster and profile details | Yes | — | Yes | — |
| Participant progress and written answers | Yes | — | Yes | — |
| Review written submissions | Yes | — | Yes | — |
| Participant export | Full organizer export | — | Full organizer export | De-identified progress summary |
| Certificates | View and manage | — | View | Aggregate dashboard only |
| Learning content | Read and edit | Read and edit | — | — |
| Registration form and site copy | Read and edit | Read and edit | — | — |
| Settings | Read and edit | — | — | — |
| Admin accounts and roles | Read and manage | — | — | — |
| Audit log | Read | — | — | — |

Legacy `SAFEGUARDING` database rows are treated as `SAFEGUARDING_REVIEWER`; legacy `VIEWER` rows are treated as `REPORTING_ADMIN`. The migration retains those enum values and account records. New assignments use only the four canonical role values.

## Sensitive data controls

- Reporting exports are monthly aggregates by member type. They omit names, Scout IDs, contact details, unit and district and do not allow participant-level filters.
- Paragraph/reflection answers are accessible only to SUPERADMIN and SAFEGUARDING_REVIEWER and are audited on read.
- Written-submission review actions are enforced server-side and audited. Reporting admins cannot read or review answers.
- Admin credential, role, disable, reset and soft-delete changes revoke active sessions. The last active SUPERADMIN cannot be demoted, disabled or soft-deleted.
- Audit rows are inserted transactionally with sensitive account changes. Database triggers reject update and delete operations on the audit table.
