# Admin guide

Open the organizer console at `/admin/login` (English) or `/bn/admin/login` (Bangla). Sign in with the email or login ID and password already assigned to your account. Do not share credentials.

## My account

Open **My account** to change your display name, login ID or email. The current password is required. Changing login ID or email signs out active sessions. Passwords require at least 12 characters; changing a password signs out all sessions. The page lists active sessions and can revoke other devices.

New and reset admin passwords are generated once and returned only to the creator's current page. Copy the temporary value and provide it securely to the administrator. Their first sign-in requires a password change.

## Admin accounts

SUPERADMIN can open **Admin accounts** to create an account, assign a role, edit another account, reset its password, disable/enable access, or soft-delete it. Sensitive changes require re-entering the current SUPERADMIN password. The last active SUPERADMIN is protected. Admin account removal is reversible in the database and does not erase audit history.

## Existing organizer pages

- **Dashboard** shows registration, completion and certificate aggregates.
- **Participants** supports filtering, pagination, progress review and role-limited CSV export. Reporting admins receive monthly aggregates only; safeguarding staff and SUPERADMIN can export the participant roster.
- **Reflection answers** is restricted to SUPERADMIN and SAFEGUARDING_REVIEWER; each visit and written-submission decision is recorded in the audit log. Reviewers can approve an answer or request a revision with a comment.
- **Certificates** supports existing certificate operations for authorized roles.
- **Content** edits Rover and Leader modules independently in Bangla and English. Save a draft to keep changes private, inspect the YouTube preview and track preview, then publish from version history. Publishing and rollback require the current admin password. An older published snapshot is restored as a new published version; history is retained.
- **Audit log** is read-only and SUPERADMIN-only.

All organizer screens include the Bangla/English controls. Use the existing theme control in the site shell to switch light and dark appearance.

## Learning content

Open **Content**, choose a module, then edit its JSON. The editor accepts a bare YouTube video ID or a YouTube watch, short, embed, or Shorts URL; the server normalizes it to an ID and uses the privacy-enhanced embed. The rich-text `writtenBn` and `writtenEn` fields allow headings, lists, links and HTTPS images; the server sanitizes the markup before storing and rendering it.

Question types are `MCQ` (one answer), `MULTI_SELECT` (several answers), `SCENARIO` (single-choice scenario), `REFLECTION` and `PARAGRAPH`. Each question can include bilingual options, points, word limits and bilingual explanations. Keep step IDs when editing a question that already has participant responses. Removing a question with responses archives the database row; it does not erase the response. Array order controls question order. JSON can be exported from the editor and pasted back in to import.

For each module, `audience` is fixed after creation, `passMark` overrides the global pass mark, `mustWatch` controls whether watching is a completion requirement, and `paragraphApprovalRequired` gates written responses until a reviewer approves them. `attemptsAllowed` is stored in the published module settings; separate multi-attempt history and retake controls are not yet implemented. The structured form builder, CSV question import/export, drag-and-drop question ordering, and per-audience assessment-attempt controls remain follow-up work.

New modules stay unpublished until a draft is published. Existing published content remains visible while drafts are edited. Publishing requires a complete Bangla and English translation and reauthentication. Learners who already started a module stay pinned to the version and effective pass mark they began with; learners who start later receive the latest published version. The editor lists the latest 20 versions; all versions remain stored. A rollback creates a new version from the selected archived snapshot and immediately publishes it.

## Deployment notes

Admin security schema changes require applying the additive Prisma migration to a backed-up Neon branch first, then setting the branch connection for a Vercel preview. Do not run `prisma migrate reset`, destructive `db push`, or an unreviewed migration against production. The production deployment is unchanged while the control-center feature branch is under review.
