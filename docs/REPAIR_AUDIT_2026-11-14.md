# Kritarth Gyan Ganga — Repair Audit

Date: 2026-11-14
Target branch: `main`
Working branch: `fix-admin-auth-fee-audit`
Scope: minimal, backwards-conscious corrections to admin role propagation and fee dashboard calculations.

## Baseline findings

1. The landing-page login always wrote `role: "admin"`, even when the authenticated account was the Super Admin. This could make role checks inconsistent depending on which login entry point was used.
2. The dedicated login page derived `role` from `admin.role` but separately honored `admin.isSuperAdmin`, allowing those two session fields to disagree for legacy admin records.
3. Fee collection rate was capped at 100%, so a collection greater than the expected amount could never be displayed accurately.
4. Dashboard expected fees were estimated using the current monthly fee multiplied by the number of months. That ignored historical fee-plan changes/promotions.
5. Fee calculations and student rows did not consistently scope payments to the selected year (or current year when no year was selected).
6. `monthlyFeeAmount` fell back to the current monthly fee when a historical fee plan was inactive, which could charge a student for months before their fee plan began.
7. Class filtering read draft month/year selectors rather than the applied filter values.

## Changes made on this branch

- Normalize Super Admin role, `isSuperAdmin`, and `userId` in both login entry points.
- Calculate expected fees by summing each month's applicable historical fee plan.
- Scope fee dashboard collections and student payment rows consistently to the selected year; default to the current year if none is selected.
- Allow collection rates above 100% to display accurately.
- Return zero monthly fees for months before a student's first fee plan becomes active.
- Make class filtering use applied filter values, so unsubmitted draft changes do not affect the results.

## Files changed

- `src/LandingPage.jsx`
- `src/pages/Login.jsx`
- `src/pages/admin/FeesManagement.jsx`
- `src/utils/monthlyFees.js`

## Intentionally not changed

- Student, teacher, payment, receipt, and website-content data structures.
- Existing storage keys and existing local records.
- Supabase schema, database, and deployment configuration.
- Authentication storage architecture.

## Important security limitation

The current application still authenticates admins against browser `localStorage` and stores passwords there in plaintext. This is not production-safe. Replacing it with Supabase Auth/server-side authorization requires a separate, staged migration and verification of existing admin accounts and application records. It is deliberately not attempted in this minimal repair because changing the authentication backend without a verified migration could lock out the owner or disrupt working features.

## Verification status

- GitHub branch writes: successful.
- File updates: committed to this branch.
- Automated build/runtime test: not run in this editing session; must be checked in the Vercel preview or local environment before merging.
- Production/main branch: untouched.
- Merge: not performed.
