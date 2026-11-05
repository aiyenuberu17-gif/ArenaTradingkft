# Arena Trading Kft.

Arena Trading Kft.'s multilingual business technology website, product catalog, quote-request flow, company information pages, and administration tools.

## Run & Operate

- The website runs through the managed `artifacts/computrade-website: web` workflow.
- The API runs through `artifacts/api-server: API Server` and is routed under `/api`.
- `pnpm run typecheck` — typecheck workspace libraries and app packages.
- `pnpm run build` — typecheck and build workspace packages.
- `pnpm --filter @workspace/db run push` — apply the Drizzle schema to the development database.
- The development database is provided through `DATABASE_URL`.

## External configuration

The website and API start without external service credentials. Some features need configuration:

- `ADMIN_PASSWORD` — enables administrator sign-in.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — enable Supabase Storage for company document uploads.
- `SUPABASE_STORAGE_BUCKET` — optional; the API has a default bucket name.
- `WEB3FORMS_ACCESS_KEY` — optional; enables email notifications for quote requests.

Add credentials through Replit Secrets, never in source files or commits. The app falls back to the Replit-managed PostgreSQL database when `SUPABASE_DATABASE_URL` is not set.

## Stack

- pnpm workspace, Node.js 20, TypeScript
- Website: React, Vite, Tailwind CSS
- API: Express 5
- Database: PostgreSQL with Drizzle ORM
- API contracts: OpenAPI with generated Zod and React Query clients

## Where things live

- `artifacts/computrade-website` — public website and administration UI
- `artifacts/api-server` — API routes and Supabase Storage adapter
- `lib/db` — PostgreSQL schema, Drizzle config, and migrations
- `lib/api-spec` — API contract source
- `lib/api-client-react` and `lib/api-zod` — generated API clients and validators
- `attached_assets/generated_images` — catalog and hero photography

## Gotchas

- Vite requires the managed workflow's `PORT` and `BASE_PATH`; use the workflow rather than starting Vite manually.
- The documents upload flow also uses `uploaded_files_temp`, created by `lib/db/migrations/20260811_create_company_documents.sql`.
