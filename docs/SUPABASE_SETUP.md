# Kritarth Gyan Ganga — Supabase setup

## Current migration status
This ZIP has been prepared with a Supabase client bootstrap and a fresh-database SQL foundation. The existing application still uses its current localStorage functions. This is intentional: the UI is not switched to an unconfigured backend, which would break existing screens before the project URL, publishable key, Auth users, and database are ready.

## 1. Create the Supabase project
1. Create a project at https://supabase.com/dashboard.
2. Choose a region close to your users (India if offered).
3. Save the database password privately. It is not needed in the browser.
4. In SQL Editor, run `supabase/schema.sql` on this empty project.
5. In Authentication > Users, create the first trusted administrator account.
6. Copy that user's UUID. In SQL Editor, run:

```sql
update public.profiles
set role = 'super_admin', full_name = 'Saroj Kumar', is_active = true
where id = 'PASTE_AUTH_USER_UUID_HERE';
```

Do not expose the database password or service-role/secret key in chat, source code, or Vite environment variables.

## 2. Configure local development
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the browser-safe Project URL and publishable/anon key from Project Settings > API.
3. Install dependencies: `npm install`.
4. Start development: `npm run dev`.

The browser-safe key is not a substitute for Row Level Security. Never put a service-role/secret key in a `VITE_` variable.

## 3. Important migration boundary
The existing screens call synchronous localStorage functions in `src/utils/storage.js`. Supabase network operations are asynchronous. Replacing these functions in-place without updating their callers would cause race conditions and broken pages. The next implementation stage must migrate each feature to async service functions and loading/error states, in this order:

1. Auth and role checks (`Login.jsx`, `ProtectedRoute.jsx`, landing-page login modal).
2. Students and teachers.
3. Fee plans, payments, reversals, allocations and receipt reads.
4. Demo requests.
5. Achievements and image uploads.
6. Website content, offers, class schedule, payment methods and audit logs.

Keep `monthlyFees.js`, receipt branding/assets, existing page layouts and routes unless a specific compatibility change is required.

## 4. Fresh database means fresh records
The SQL creates empty application tables. It does not import localStorage records or seed demo student/payment data. Remove demo credentials from the login UI only when Supabase Auth login is connected and verified. Never use the old hardcoded password system in production.

## 5. Hostinger deployment
Build with `npm run build` and upload the contents of `dist/` to the domain's `public_html` folder. Configure SPA rewrite rules so React Router routes load on refresh. Add the same two browser-safe Vite variables to the production build environment before building. Enable SSL and verify the root and www domain.
