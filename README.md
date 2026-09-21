# MindFlow Task Planner

MindFlow is a dark, mobile-first productivity app for capturing ideas, planning tasks, and tracking long-term goals with milestones. It is a portfolio project built with React, TypeScript, Vite, and Supabase.

## Features

- Email/password authentication through Supabase Auth.
- Task planning with dates, priorities, recurring tasks, overdue filters, and completion tracking.
- Inspiration inbox with search and tags.
- Goals with milestones and derived progress.
- Responsive, app-like UI with loading, empty, and error states.
- Owner-scoped Row Level Security: each signed-in user can access only their own records.

## Architecture

```text
React UI
  -> service modules (tasks, goals, inspirations)
  -> Supabase browser client
  -> Supabase Auth + Postgres + RLS
```

The UI never uses a service-role key. The browser uses only `VITE_SUPABASE_URL` and the public anon key. Database policies remain the final access-control boundary; client-side filters are not treated as security controls.

## Data model

```text
auth.users
  ├── tasks
  ├── inspirations
  └── goals ───< milestones
```

Every business row has a `user_id`. Policies require `auth.uid() = user_id`; milestone policies also verify that the parent goal belongs to the same user.

## Local setup

Prerequisites: Node.js 20+ and a Supabase project.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Never place a service-role key in the frontend or commit a real `.env.local` file.

For a new database, review and run `supabase/init.sql` in the Supabase SQL editor, then configure email authentication. For an existing database, review `supabase/migrations/001_secure_row_ownership.sql` first. It intentionally stops when existing rows have no owner mapping; it does not guess ownership or delete data.

## Checks

```bash
npm run lint
npm test
npm run build
```

The repository test suite includes static checks for the owner-scoped policies and the guarded migration. Live authorization must still be verified against a disposable Supabase project with anonymous, user A, and user B sessions.

## Security notes and limitations

- Repository SQL is not proof that a production database has been migrated. Inspect and verify the live project's policies separately.
- Existing rows require an explicit ownership mapping before the migration can add `NOT NULL` constraints.
- This is a portfolio application, not a compliance-certified identity or task-management service.
- Demo images and background URLs should be replaced with assets whose license is suitable for the deployment.

## Project layout

```text
App.tsx                 React application and UI flows
src/lib/supabase.ts     Auth client and database types
src/services/           Data access modules
supabase/init.sql       Fresh-install schema and RLS
supabase/migrations/    Reviewed migration for existing databases
tests/                  Security-focused automated checks
```
