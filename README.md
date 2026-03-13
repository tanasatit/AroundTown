# SeeYou AroundTown

Cash flow tracking system for Thai postcard vending machines.

## Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js API Routes + Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js v5
- **Deploy**: Vercel

## Quick Start

```bash
# Install
npm install

# Setup database
npx prisma generate
npx prisma db push
npm run db:seed

# Run
npm run dev
```

Open http://localhost:3000

**Login**: `admin@minimystery.com` / `admin123`

## Project Structure

```
app/
├── (auth)/login/        # Login page
├── (dashboard)/         # Protected pages
│   ├── collections/     # History table + new collection form
│   ├── reports/         # Weekly & location summaries + Excel export
│   └── settings/        # Machine management
├── api/
│   ├── auth/            # NextAuth
│   ├── collections/     # Collection CRUD
│   ├── machines/        # Machine management
│   ├── refills/         # Refill tracking
│   └── stats/           # Dashboard stats
lib/
├── auth.ts              # Auth config
├── prisma.ts            # DB client (singleton)
├── calculations.ts      # Business logic
├── stats.ts             # Dashboard + chart data (cached)
├── reports.ts           # Report aggregations (cached)
└── validations/         # Zod schemas
prisma/
└── schema.prisma        # Database schema
tests/
└── unit/                # Vitest unit tests
docs/                    # Documentation
prp/                     # Implementation plans (PRP-001 → PRP-016)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collections` | Create collection |
| GET | `/api/collections` | List (paginated, filterable) |
| GET | `/api/collections/[id]` | Get one |
| PUT | `/api/collections/[id]` | Update |
| DELETE | `/api/collections/[id]` | Delete |
| GET | `/api/machines` | List machines |
| POST | `/api/machines` | Create machine |
| GET | `/api/refills` | List refills |
| POST | `/api/refills` | Create refill |
| GET | `/api/stats` | Dashboard stats |

## Business Logic

```
1 postcard = 40 baht = 4 x 10-baht coins
Profit = Revenue - (postcards x 13.766)
Exchange box target = 12,000 baht per round
```

## Development

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Unit tests (Vitest)
npm run test:watch   # Watch mode
npx prisma studio    # Database GUI
npx prisma db push   # Apply schema changes to DB
```

## Environment Variables

```env
DATABASE_URL=       # Supabase pgbouncer URL (port 6543, ?pgbouncer=true)
DIRECT_URL=         # Supabase direct URL (port 5432, for migrations)
NEXTAUTH_URL=       # App URL (e.g. https://yourapp.vercel.app)
NEXTAUTH_SECRET=    # Random secret string
```

## CI/CD

GitHub Actions runs on every push/PR to `main`:

1. **lint** — ESLint
2. **typecheck** — TypeScript (no emit)
3. **test** — Vitest unit tests
4. **build** — Next.js production build (requires all 3 to pass)

## Completed Features

- [x] Collection recording with exchange box tracking
- [x] Dashboard with stats cards and trend indicators
- [x] Revenue & profit area charts (8-week history)
- [x] Collections history table with filters, sorting, pagination
- [x] Reports page with weekly & location summaries
- [x] Excel export (.xlsx)
- [x] Refill tracking (inline with collection form)
- [x] Machine management (settings page)
- [x] Responsive design (mobile + desktop)
- [x] Loading skeletons + error boundaries
- [x] Unit tests for business logic
- [x] CI/CD with parallel jobs
- [x] Performance: data caching, bundle optimization, DB connection pooling
