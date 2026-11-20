# Google sign-in and role approval

Supabase Auth verifies the Google identity. On first login the application creates a student account in the configured institution. Identity is bound to the Supabase Auth UUID. Existing accounts are never automatically linked by email. All protected routes and server actions load active roles from the database.

Users request officer, reviewer, or administrator access in My profile. An administrator approves or denies requests in Accounts. Approval grants the role in a transaction with the decision and audit event. An administrator can revoke other users' privileged roles. A second officer account is another officer assignment, and the announcement workflow requires a different user to approve a draft.

## Setup

1. Apply migrations to the intended isolated prototype database. Migration creates the `prototype-institution` institution. Set `DATABASE_URL` and `INSTITUTION_ID=prototype-institution`. Never seed demonstration accounts into a real institution.
2. In Supabase enable Google authentication and configure the Google OAuth client. Add the Supabase callback URI to Google Cloud. In Supabase Auth URL configuration add the exact `APP_URL/auth/callback` for the chosen environment. See [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) and [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).
3. Configure server environment variables `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `APP_URL`, `DATABASE_URL`, `INSTITUTION_ID`, and `BOOTSTRAP_ADMIN_SUBJECT`. Set the last value to the exact Supabase Auth UUID of the intended administrator, not an email. The UUID must identify that Google user before their first app login. Keep the database URL private.
4. Deploy the branch and sign in as the bootstrapped administrator. Confirm Accounts displays the role request queue. Remove the bootstrap variable after the first successful sign-in and redeploy. The database role persists.
5. Sign in with a second Google account, verify student access and submit a privileged role request. Approve it from the administrator account, then verify access to the appropriate workspace.

The automatic bootstrap grant only occurs during first application registration. If the account has already registered, an operator can run `pnpm exec tsx scripts/bootstrap-admin.ts` with the correct `DATABASE_URL`, `INSTITUTION_ID`, and exact `BOOTSTRAP_ADMIN_SUBJECT` configured. The script grants the active matching account access and records an audit event. Do not set the bootstrap subject to an unverified identity. Production demo credentials and role switching remain disabled.

The production authentication flow and Vercel deployment require the actual project settings and an end-to-end verification. Do not treat this prototype as institutional-ready. Configure RLS and database access carefully if the Supabase PostgreSQL database is shared with other clients. Prisma database credentials are server-side and must not be exposed through public environment variables.
