# TuitionPro production security

This version fixes the immediate frontend safety issues while preserving the current UI/data contract:

- Public Super Admin/admin registration has been removed from the landing page.
- Student deletion is now an archive operation; payment history is preserved.
- Payments can be reversed instead of deleted. Reversed transactions remain visible in history and are excluded from fee totals.
- Website Content is now manageable from Admin > Website Content (hero, contact details, next class and student stories).
- Fee calculations ignore reversed payments and account for a student's fee start month when calculating annual expected fees.
- Student Stories rotate automatically on the public website and retain a fixed photo frame.

## Remaining production migration

The current project still uses browser localStorage for application data because the existing React screens are synchronous. For a real deployment, move authentication and all data mutations behind a server API/database before exposing the system publicly. Do not put passwords, Aadhaar numbers, or payment records in browser storage.

Recommended server stack: Node.js API + PostgreSQL, with Argon2id/scrypt password hashing, HTTP-only secure session cookies, server-side role checks, audit logs, backups and encrypted sensitive fields.
