# SeeYou AroundTown - Cash Flow System

## What This Is
A Next.js web app for tracking Thai postcard vending machine cash flow. Users count coins twice weekly, system calculates sales automatically.

## Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js (credentials)
- **Deploy**: Vercel + Supabase

## Core Business Logic
```
1 postcard = 40 baht = 4 × 10-baht coins
Postcards sold = (coins from machine) ÷ 4
Revenue = postcards sold × 40
Profit = revenue - (postcards sold × 13.766)
```

## Design System
**Thai Theme** (from brand):
- Primary Gold: `#D4AF37` 
- Accent Red: `#DC2626`
- Background: `#FDF6E3` (cream)
- Text: `#3E2723` (brown)

**Dashboard Style** (dark mode with shadcn):
- Dark cards with rounded corners
- Subtle borders and shadows
- Area charts for trends
- Stat cards with trend indicators
- English language only

## Key Rules
1. Machine only accepts 10-baht coins
2. Exchange box must balance to 12,000 baht each round
3. 2 collections per week
4. Support multiple machine locations
5. Cost per postcard = 13.766 baht (can change)

## File Structure
```
/docs           - Business rules, architecture
/prp            - Problem-Requirements-Plan docs
/app            - Next.js pages and API routes
/components     - React components
/lib            - Utilities, Prisma, auth
/prisma         - Database schema
```

## Development Workflow
1. Write PRP (Problem-Requirements-Plan)
2. Review & lock decisions
3. Implement code
4. Test & verify
5. Commit
6. Repeat

## Context Engineering Notes
- Keep prompts focused on one PRP at a time
- Reference `docs/` for business context
- Lock architectural decisions before coding
- Use shadcn/ui components (dark theme)
- Follow Thai color palette for accents

---

See `/docs` for detailed documentation.