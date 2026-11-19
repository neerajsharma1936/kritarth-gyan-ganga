# Supabase central-data migration plan

## Scope and safety

This migration moves application records from browser `localStorage` to the existing Supabase PostgreSQL schema in small, reviewable phases. The UI, routes, student/fee workflows, receipt layout, ID-card generation, and existing calculations must remain unchanged.

The user confirmed that there are no real student/payment records to migrate and prefers a fresh database. Do not clear or drop any Supabase tables, buckets, Auth users, or storage objects as part of this work. "Fresh" means the application data tables may start empty; it is not permission to reset the Supabase project.

## Repository findings (main at 2026-11-19)

- `src/lib/supabase.js` initializes the browser Supabase client using the publishable/anon key.
- `src/lib/auth.js` authenticates administrators with Supabase Auth and checks `public.profiles`.
- `src/components/common/ProtectedRoute.jsx` verifies admin sessions against Supabase, but student access currently trusts the local session snapshot.
- `src/utils/storage.js` remains the synchronous localStorage data layer for students, payments, teachers, teacher salary payments, demo requests, website settings, achievements, offers, schedules, payment methods, and admin snapshots.
- `src/pages/admin/AdminDashboard.jsx` reads dashboard metrics from that local layer.
- `src/pages/student/StudentDashboard.jsx` reads student/payment data from that local layer.
- `src/lib/websiteContent.js` is the Supabase-backed website-content implementation; keep it intact.
- `supabase/schema.sql` already defines the central tables, JSONB payload columns, indexes, role helpers, RLS policies, and storage buckets. It is explicitly intended for a new database foundation.

## Required implementation phases

### Phase 1 — database foundation and security review
1. Review `supabase/schema.sql` against the current production Supabase project before applying it.
2. Verify the tables and policies exist; do not blindly rerun setup SQL or drop project data.
3. Create/verify the first trusted administrator in Supabase Auth and promote only that account's profile to `super_admin` through a controlled SQL operation.
4. Confirm anon users can only read published public content and submit demo requests; all student, teacher, payment, salary, and admin data must remain staff-only.

### Phase 2 — repository/data service
1. Introduce an asynchronous Supabase repository layer; do not silently fall back to localStorage for writes.
2. Keep the existing React object shapes through the schema's `data jsonb` columns.
3. Add explicit loading/error states and refresh/realtime strategy.
4. Keep localStorage only for non-authoritative UI/session preferences.

### Phase 3 — migrate modules in dependency order
1. Students and fee-plan history.
2. Payments and payment allocations, with an atomic database RPC for payment recording/reversal and recalculation.
3. Teachers and salary payments.
4. Student authentication and per-student row authorization.
5. Achievements and their image Storage paths.
6. Demo requests, payment methods, offers, and class schedules.
7. Dashboard queries.

### Phase 4 — regression and release
- Verify add/edit/archive/restore/delete student workflows.
- Verify fee history, partial payments, reversals, outstanding balances, and transaction attribution.
- Verify receipt print/PDF and student ID card output are unchanged.
- Verify achievements and public content across a second browser/device.
- Run production build and Vercel preview checks before merging.
- Do not merge or change production Supabase until the preview and SQL policy checks pass.

## Acceptance criteria

- No business records are written only to browser localStorage.
- Refreshing or signing in on a second device returns the same authorized records.
- Students can access only their own profile and payment history.
- Admin operations require a live Supabase Auth session and active staff profile.
- Payment create/reversal operations are atomic and auditable.
- Existing UI, calculations, receipts, and ID cards pass regression checks.

## Explicit non-goals

- No redesign or route changes.
- No changes to receipt visual design.
- No deleting existing tables, Auth users, Storage buckets, or files.
- No service-role key in browser code or Vercel client-side environment variables.
