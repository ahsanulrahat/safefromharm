# Admin guide

Open the organizer console at `/bn/admin/login` or `/en/admin/login`. Sign in with the email or login ID and password already assigned to your account. Do not share credentials.

## My account

Open **My account** to change your display name, login ID or email. The current password is required. Changing login ID or email signs out active sessions. Passwords require at least 12 characters; changing a password signs out all sessions. The page lists active sessions and can revoke other devices.

New and reset admin passwords are generated once and returned only to the creator's current page. Copy the temporary value and provide it securely to the administrator. Their first sign-in requires a password change.

## Admin accounts

SUPERADMIN can open **Admin accounts** to create an account, assign a role, edit another account, reset its password, disable/enable access, or soft-delete it. Sensitive changes require re-entering the current SUPERADMIN password. The last active SUPERADMIN is protected. Admin account removal is reversible in the database and does not erase audit history.

## Existing organizer pages

- **Dashboard** shows registration, completion and certificate aggregates.
- **Participants** supports filtering, pagination, progress review and role-limited CSV export. Reporting admins receive monthly aggregates only; safeguarding staff and SUPERADMIN can export the participant roster.
- **Reflection answers** is restricted to SUPERADMIN and SAFEGUARDING_REVIEWER; each visit is recorded in the audit log.
- **Certificates** supports existing certificate operations for authorized roles.
- **Content** currently edits published module JSON directly. The draft/publish/version workflow is planned for the next CMS milestone and is not available yet.
- **Audit log** is read-only and SUPERADMIN-only.

All organizer screens include the Bangla/English controls. Use the existing theme control in the site shell to switch light and dark appearance.

## Deployment notes

Admin security schema changes require applying the additive Prisma migration to a backed-up Neon branch first, then setting the branch connection for a Vercel preview. Do not run `prisma migrate reset`, destructive `db push`, or an unreviewed migration against production. The production deployment is unchanged while the control-center feature branch is under review.
