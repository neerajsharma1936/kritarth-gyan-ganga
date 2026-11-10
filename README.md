# BrightPath Bihar + TuitionPro

Merged React/Vite website and education dashboard.

## Run
1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown by Vite.

## Current flow
- `/` — public landing page.
- `/login` — administrator/student login.
- `/admin` — protected admin dashboard.
- `/admin/website-content` — manage public hero, contact details, next class and student stories.
- `/admin/students` — active student management; deletion is now archive-only so payment history is retained.
- `/admin/fees` — fee filters, collection stats and payment recording; reversed payments are excluded from totals.

## Safety improvements in this build
- Public admin/Super Admin sign-up has been removed.
- Super Admin password changes are preserved instead of being overwritten by a hard-coded login repair.
- Student deletion is non-destructive archive behavior.
- Financial transactions support reversal while retaining the original transaction/audit information.
- Fee calculations respect fee start month for annual expected fees and ignore reversed payments.
- Website content is editable from the protected dashboard and student stories rotate automatically on the landing page.

## Production warning
The current app still uses browser `localStorage` because the existing screens are synchronous. This is **not suitable for storing real passwords, Aadhaar data or financial records in production**. The next production phase should move authentication, authorization and data persistence to a server-side API/database with hashed passwords, secure HTTP-only sessions, server-side role checks, audit logs, encryption and backups.
