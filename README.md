# PlacementBridge

Independent academic prototype for trustworthy placement communication. It is not endorsed by LPU or connected to institutional records. Use synthetic data only. This is not pilot- or production-ready.

## Local setup

Requires Node.js, pnpm, Docker Compose and PostgreSQL. The committed Compose file binds a development database to localhost only. Never point demo seeding at a real database.

1. `pnpm install`
2. Copy `.env.example` to `.env`. Set a random `AUTH_SECRET` and a local `DEMO_PASSWORD` of at least 12 characters. Use `APP_MODE=development`.
3. `docker compose up -d`
4. `pnpm exec prisma migrate deploy`
5. `pnpm db:seed`
6. `pnpm dev` and open http://localhost:3000.
7. `pnpm typecheck`, `pnpm test`, and `pnpm build`.

Synthetic accounts use the configured demo password: `student@example.test`, `officer@example.test`, `approver@example.test`, `reviewer@example.test`, and `admin@example.test`. The seed does not overwrite existing accounts or passwords. The demo provider refuses sign-in when `NODE_ENV=production` or `APP_MODE` is not `development`; therefore use the development server for this local demonstration. Production requires a separately implemented approved identity provider. Demo accounts are not real university identities.

To exercise the intended announcement slice, sign in as the officer and create and submit a synthetic draft; sign out and sign in as the approver to approve and publish; sign in as the student to see it. This path has not yet been verified against a running database in this environment. Drafts and review states are hidden from students. No confidential submissions, uploads, corrections or notifications are implemented.

Read [implementation plan](docs/IMPLEMENTATION_PLAN.md), [status](docs/IMPLEMENTATION_STATUS.md), [permissions](docs/architecture/permissions.md), and [threat model](docs/architecture/threat-model.md) before further development. Never use the local credentials for a pilot. No database reset command is part of the setup.
