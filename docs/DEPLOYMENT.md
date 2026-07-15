# Deployment

Reference topology: **Vercel** (Next.js + crons) + **Supabase** (Postgres, Auth, Storage,
Realtime, Edge Functions).

## 1. Supabase project

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <PROJECT_REF>
pnpm exec supabase db push          # applies supabase/migrations/*
# Optional demo data (NOT for production):
#   run supabase/seed.sql via the SQL editor or psql
pnpm exec supabase functions deploy close-campaigns
pnpm exec supabase functions deploy process-outbox
pnpm exec supabase secrets set CRON_SECRET=<random>
```

Dashboard settings:
- Auth → URL configuration: site URL `https://<domain>`, redirect
  `https://<domain>/auth/callback` and `/auth/confirm`.
- Auth → Email: confirmations ON. Google OAuth optional (set client id/secret).
- Database → find the connection string for `SUPABASE_DATABASE_URL` (migrations/CI).

## 2. Vercel

Import the repo (framework: Next.js, pnpm detected). Environment variables — see
`.env.example` for the full list; minimum production set:

| Variable | Value |
| --- | --- |
| NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_APP_NAME | your domain / brand |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | project settings |
| SUPABASE_SECRET_KEY | service role key — **server only** |
| PAYMENT_PROVIDER=mock, PAYMENT_WEBHOOK_SECRET | until a provider is contractually approved |
| EMAIL_PROVIDER=log (or adapter), EMAIL_FROM | |
| GEOLOCATION_PROVIDER=headers, KYC_PROVIDER=mock (or adapter) | |
| APP_ENCRYPTION_KEY, CRON_SECRET, INTERNAL_API_SECRET | 32+ byte randoms |
| ENABLE_REAL_PAYMENTS=false, ENABLE_PAID_ENTRIES, ENABLE_FREE_ENTRIES, ENABLE_SKILL_COMPETITIONS | flags |

`vercel.json` registers the two crons (`close-campaigns` */10, `process-outbox` every
minute); Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the env var
exists.

## 3. Bootstrap staff

After the first sign-up, grant roles with the service key (SQL editor):

```sql
insert into public.user_roles (user_id, role)
select id, r from auth.users, unnest(array['admin','super_admin']::public.user_role[]) r
where email = 'you@company.com'
on conflict do nothing;
```

## 4. Go-live checklist

- [ ] Migrations applied; `/api/health` returns healthy.
- [ ] Crons firing (Vercel cron logs; `webhook_events`/`outbox_events` moving).
- [ ] Legal review completed per territory (docs/LEGAL_REVIEW_CHECKLIST.md) **before**
      activating any jurisdiction.
- [ ] Payment provider contractually approved (docs/PROVIDER_APPROVAL_CHECKLIST.md)
      before ENABLE_REAL_PAYMENTS.
- [ ] Email + KYC adapters configured; templates reviewed.
- [ ] Demo seed absent from production; real categories/fees configured.
- [ ] Backups: Supabase PITR enabled; restore drill done (OPERATIONS.md).

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) gates every push/PR: format, lint, typecheck,
unit tests, build, dependency audit, then a full local-Supabase job that re-applies all
migrations (`supabase db reset`), runs integration tests and Playwright e2e. Deploys ride
Vercel's Git integration after CI is green (enable "require checks" on main).
