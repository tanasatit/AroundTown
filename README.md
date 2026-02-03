# SeeYou AroundTown

Cash flow tracking system for Thai postcard vending machines.

## Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js API Routes + Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js v5

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
├── api/
│   ├── auth/            # NextAuth
│   └── collections/     # Collection CRUD
lib/
├── auth.ts              # Auth config
├── prisma.ts            # DB client
├── calculations.ts      # Business logic
└── validations/         # Zod schemas
prisma/
└── schema.prisma        # Database schema
docs/                    # Documentation
prp/                     # Implementation plans
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collections` | Create collection |
| GET | `/api/collections` | List (paginated, filterable) |
| GET | `/api/collections/[id]` | Get one |
| PUT | `/api/collections/[id]` | Update |
| DELETE | `/api/collections/[id]` | Delete |

## Business Logic

```
1 postcard = 40 baht = 4 x 10-baht coins
Profit = Revenue - (postcards x 13.766)
Exchange box target = 12,000 baht
```

## Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npx prisma studio # Database GUI
```

## Progress

- [x] PRP-001: Collection API
- [ ] PRP-002: Collection Form
- [ ] PRP-003: Dashboard Stats
- [ ] PRP-004: History Table

See `/docs/implementation-plan.md` for full roadmap.
