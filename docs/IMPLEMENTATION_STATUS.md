# Implementation status

Last updated: 2026-11-20.

| Module | Status | Working functionality | Remaining / limitations | Security review | Tests |
|---|---|---|---|---|---|
| Phase 0 environment | TESTED | Next.js, TypeScript, Tailwind, PostgreSQL Compose, Prisma migrations and seed | Docker and native PostgreSQL unavailable here. Used isolated PGlite PostgreSQL engine over TCP. | Not independently reviewed | Applied both migrations and seeded. Lint, types, build and smoke checks. |
| Authentication and roles | TESTED | Demo sign-in/out, active role lookup and default denial when no active role remains | SSO, MFA, session revocation, rate limiting and department scopes | Synthetic use only | HTTP sign-in for student, both officers, reviewer and admin. Anonymous portal redirect and sign-out verified. |
| Application shells | FUNCTIONAL | Institutional public landing and sign-in, role-aware sidebar, compact notice register with visible provenance, and workspace summary. Dedicated announcement, correction, review and draft views. Editable workspace preferences and read-only identity and role details. Retractable desktop sidebar and a mobile drawer. Read-only admin account list. Optional loopback demo account picker. | Formal accessibility audit and managed identity changes | Not independently reviewed | Landing and all four roles checked over HTTP. Narrow and desktop layouts inspected in the preview browser. Student demo sign-in, sidebar navigation and notice disclosure exercised in the browser. |
| Announcements | TESTED | Draft, submit, independent approval, publication, attribution, transactional audit and published-only feed. Independently reviewed corrections preserve the original and appear in a dedicated student feed section. | Institution-wide audience only. Search and pagination are available. Per-student notifications, review return, archival and expiry remain open. | Not independently reviewed | Eight unit/service tests and a live HTTP smoke test in PGlite covering original and correction publication, provenance and draft invisibility. |
| Confidential support and later modules | NOT_STARTED | Reviewer/admin empty states only | Requires later phases and institutional review | Not reviewed | None |

The correction migration adds optional fields and an institution-scoped link to the prior announcement. Existing published notices remain readable. The new publisher snapshot applies to future publications. The student feed shows a bounded list of recent notices and corrections.

## Illustrative welcome image

`public/campus-welcome.webp` was made with the built-in ImageGen tool and optimized for the welcome page. It depicts a fictional campus.

> Editorial campus photograph for PlacementBridge’s welcome page. Three university students with backpacks, seen primarily from the back and mid-distance, walking together toward a contemporary red-brick university library along a shaded colonnade in northern India. Fictional campus. Natural unposed posture, morning light, realistic brick and stone, candid architectural editorial photography. Landscape 4:3 composition, eye-level, deep foreground and campus greenery. Muted terracotta, warm limestone, leaves and dark ink clothing. No signage, text, logos, or identifying institutional features. No headline overlay or UI. Avoid stock-photo posing, over-polished skin, or cinematic haze.
