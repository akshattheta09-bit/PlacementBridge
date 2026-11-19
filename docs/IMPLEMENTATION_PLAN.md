# PlacementBridge implementation plan

## Context and assumptions
This empty workspace starts an independent academic prototype, not an LPU-endorsed service. All accounts and records are synthetic. The first implementation supports one demonstration institution and institution-wide announcements; departmental audiences, real institutional identity, and confidential submissions are deferred pending authorization. No real placement policy or recruitment claims are implied.

## Architecture
A Next.js App Router modular monolith serves the public site and authenticated role-specific workspaces. Auth.js manages local demonstration sessions; production requires approved OIDC/SSO and MFA. Prisma and PostgreSQL hold users, scoped role assignments, announcement versions and append-oriented audit events. Server-side domain functions enforce permission, institution, status and separation-of-duties checks for every operation. Server actions validate input and delegate to these functions. Plain text is rendered as text, not HTML. Authentication and roles are reloaded from the database rather than accepted from the client.

## Incremental milestones
1. Phase 0: dependency lockfile, strict TypeScript, Tailwind tokens, PostgreSQL Compose, schema and migration, local setup, security and test configuration.
2. Phase 1: synthetic account sign-in, expiring session, current account/status checks, explicit role assignments and server permissions, student, officer, reviewer and administrator shells. No real confidential data.
3. Announcement slice: officer creates a version with source attribution; submit for review; a different authorized officer approves; an authorized officer publishes; students see only published versions in their institution. Persist audit events transactionally. Validate all transitions. Preserve the original notice and link each reviewed correction to it. Show published corrections in the student portal. Complete targeted notifications before calling the full announcement module complete.
4. Next: audience scoping, accessible correction history across paginated results, and targeted notifications; then policy and clarification workflows, followed by privacy-reviewed grievance workflows and moderated experiences.

## Verification and risks
Test permission denial, self-approval, invalid transitions, cross-institution access and published visibility at the service boundary; run types, build, integration and browser journeys against isolated PostgreSQL. Security review must cover session revocation, MFA, CSRF, rate limiting, scoped authorization, concurrent transitions, audit integrity, privacy, retention and incident response. A local demo is not suitable for institutional deployment.
