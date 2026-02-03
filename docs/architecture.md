# Architecture & Stack

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (dark theme)
- **Icons**: lucide-react
- **Charts**: recharts
- **Forms**: react-hook-form + zod validation
- **State**: React Context / Tanstack Query

### Backend
- **Runtime**: Node.js 22+
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (credentials provider)
- **Password**: bcryptjs (10 rounds)
- **Validation**: Zod schemas

### Deployment
- **Frontend + Backend**: Vercel (free tier)
- **Database**: Supabase (free tier, 500MB)
- **CI/CD**: Vercel auto-deploy (GitHub integration)
- **Domain**: [your-project].vercel.app (free)

### Development Tools
- **Package Manager**: npm
- **Code Editor**: VS Code
- **Version Control**: Git + GitHub
- **Database GUI**: Prisma Studio

## Project Structure

```
seeyou-aroundtown/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (no layout)
│   │   └── login/                # Login page
│   ├── (dashboard)/              # Dashboard group (shared layout)
│   │   ├── layout.tsx            # Dashboard layout with nav
│   │   ├── page.tsx              # Dashboard home
│   │   ├── collections/          # Collections pages
│   │   │   ├── new/              # Create collection
│   │   │   └── history/          # View history
│   │   └── refills/              # Refills pages
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth endpoint
│   │   ├── collections/          # Collection CRUD
│   │   └── refills/              # Refill CRUD
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── charts/                   # Chart components
│   └── layout/                   # Layout components (nav, etc)
├── lib/                          # Utilities
│   ├── prisma.ts                 # Prisma client
│   ├── auth.ts                   # NextAuth config
│   ├── calculations.ts           # Business logic
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
├── docs/                         # Documentation
│   ├── business.md               # Business context
│   ├── business-rules.md         # Rules & formulas
│   └── architecture.md           # This file
├── prp/                          # Problem-Requirements-Plans
│   └── [feature].md              # Individual PRPs
├── public/                       # Static assets
├── .env                          # Environment variables (gitignored)
├── .gitignore                    # Git ignore rules
├── claude.md                     # Project overview
├── package.json                  # Dependencies
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

## Database Schema

### Tables

**users**
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100)
email           VARCHAR(255) UNIQUE
password        VARCHAR(255)  -- bcrypt hashed
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**collections**
```sql
id                      SERIAL PRIMARY KEY
collection_date         DATE
round_number            INTEGER (1 or 2)
week_number             INTEGER
machine_location        VARCHAR(200)

-- Machine money (10-baht coins only)
machine_coins_10baht    INTEGER

-- Exchange box (mixed denominations)
exchange_coins_1baht    INTEGER
exchange_coins_2baht    INTEGER
exchange_coins_5baht    INTEGER
exchange_coins_10baht   INTEGER
exchange_note_20baht    INTEGER
exchange_note_50baht    INTEGER
exchange_note_100baht   INTEGER
exchange_note_500baht   INTEGER
exchange_note_1000baht  INTEGER

-- Inventory
postcards_remaining     INTEGER

-- Cost tracking
cost_per_postcard       DECIMAL(10, 4)

-- Metadata
notes                   TEXT
created_by              INTEGER → users(id)
created_at              TIMESTAMP
updated_at              TIMESTAMP

UNIQUE (collection_date, round_number, machine_location)
INDEX (collection_date)
INDEX (week_number)
INDEX (machine_location)
```

**refills**
```sql
id                  SERIAL PRIMARY KEY
refill_date         DATE
machine_location    VARCHAR(200)
postcards_added     INTEGER
postcards_before    INTEGER
postcards_after     INTEGER
notes               TEXT
created_by          INTEGER → users(id)
created_at          TIMESTAMP

INDEX (refill_date)
INDEX (machine_location)
```

### Calculated Fields (Application Layer)

These are computed in code, not stored in DB:
- `machineTotal = machineCoins10baht × 10`
- `exchangeTotal = sum(all exchange inputs)`
- `postcardsSold = floor(machineCoins10baht ÷ 4)`
- `revenue = postcardsSold × 40`
- `cost = postcardsSold × costPerPostcard`
- `profit = revenue - cost`
- `exchangeBalanced = abs(exchangeTotal - 12000) < 1`

## API Design

### Authentication
```
POST   /api/auth/[...nextauth]    # NextAuth endpoints
```

### Collections
```
POST   /api/collections            # Create collection
GET    /api/collections            # List collections (paginated)
GET    /api/collections/[id]       # Get single collection
PUT    /api/collections/[id]       # Update collection
DELETE /api/collections/[id]       # Delete collection
GET    /api/collections/stats      # Dashboard statistics
```

### Refills
```
POST   /api/refills                # Create refill
GET    /api/refills                # List refills
GET    /api/refills/[id]           # Get single refill
PUT    /api/refills/[id]           # Update refill
DELETE /api/refills/[id]           # Delete refill
```

### Request/Response Format

**Create Collection (POST /api/collections)**
```json
{
  "collectionDate": "2026-02-05",
  "roundNumber": 1,
  "weekNumber": 6,
  "machineLocation": "Rare Aroon - Ground Floor",
  "machineCoins10baht": 300,
  "exchangeCoins1baht": 50,
  "exchangeCoins2baht": 100,
  // ... other exchange fields
  "postcardsRemaining": 525,
  "notes": "Optional note"
}
```

**Response**
```json
{
  "id": 1,
  "collectionDate": "2026-02-05",
  "roundNumber": 1,
  // ... all input fields
  "machineTotal": 3000,
  "exchangeTotal": 12000,
  "postcardsSold": 75,
  "revenue": 3000,
  "cost": 1032.45,
  "profit": 1967.55,
  "exchangeBalanced": true,
  "createdAt": "2026-02-05T10:30:00Z",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@seeyou.com"
  }
}
```

## Authentication Flow

1. User visits `/login`
2. Submits email + password
3. NextAuth validates credentials
4. If valid: creates JWT session (7 days)
5. Redirects to `/dashboard`
6. Middleware checks auth on protected routes
7. If no session: redirects to `/login`

## Design System

### Colors (shadcn dark theme)
```typescript
// Dark mode base
background: "hsl(0 0% 3.9%)"        // #0a0a0a
foreground: "hsl(0 0% 98%)"         // #fafafa
card: "hsl(0 0% 3.9%)"              // #0a0a0a
border: "hsl(0 0% 14.9%)"           // #262626

// Thai theme accents
thai-gold: "#D4AF37"
thai-gold-dark: "#B8941E"
thai-red: "#DC2626"
thai-red-dark: "#B91C1C"

// Status colors
success: "hsl(142 76% 36%)"         // Green
warning: "hsl(38 92% 50%)"          // Orange
error: "hsl(0 84% 60%)"             // Red
info: "hsl(217 91% 60%)"            // Blue
```

### Typography
```css
font-display: "Fredoka", "Mali", sans-serif;        /* Headers */
font-body: "Kanit", "Sarabun", sans-serif;          /* Body */
font-mono: "JetBrains Mono", monospace;             /* Numbers */
```

### Components
- Use **shadcn/ui** components (copy-paste, not npm)
- Dark theme by default
- Rounded corners (12px)
- Subtle shadows and borders
- Thai gold/red for primary actions

## Performance Considerations

### Database
- Indexes on: date, week, location
- Connection pooling (Prisma default)
- Max 3 users = minimal load

### Frontend
- Next.js automatic code splitting
- Image optimization (next/image)
- Lazy load charts
- Debounce search inputs

### Caching
- Static pages: ISR (Incremental Static Regeneration)
- API routes: No cache (always fresh data)
- Images: CDN caching (Vercel)

## Security

### Authentication
- Passwords: bcrypt (10 rounds)
- Sessions: JWT (7 days expiry)
- HTTPS only (Vercel enforces)
- CSRF protection (NextAuth built-in)

### Authorization
- All API routes check session
- Middleware protects dashboard routes
- User can only see own data (currently all users see all)

### Input Validation
- Frontend: Zod schemas
- Backend: Zod schemas (double validation)
- SQL injection: Prisma prevents (parameterized)
- XSS: React escapes by default

### Environment Variables
```bash
DATABASE_URL="postgresql://..."        # Supabase connection
NEXTAUTH_URL="https://..."             # Production URL
NEXTAUTH_SECRET="..."                  # Random 32-char string
```

## Deployment Strategy

### Development
```bash
npm run dev          # Local development (http://localhost:3000)
npx prisma studio    # Database GUI (http://localhost:5555)
```

### Staging/Production
1. Push to GitHub
2. Vercel auto-deploys
3. Environment variables set in Vercel dashboard
4. Database migrations via Prisma:
   ```bash
   npx prisma db push     # Push schema changes
   npx prisma generate    # Generate client
   ```

### CI/CD Checklist
- ✅ TypeScript compiles (`npm run build`)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Environment variables set
- ✅ Database schema pushed
- ✅ Prisma client generated

## Monitoring & Logs

### Vercel Dashboard
- Deployment logs
- Function logs (API routes)
- Analytics (page views, performance)

### Supabase Dashboard
- Database size
- Connection count
- Query performance

### Error Handling
```typescript
// API routes
try {
  // ... logic
} catch (error) {
  console.error('Error:', error);  // Logs to Vercel
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Future Enhancements (Phase 4+)

### IoT Integration
- ESP32 microcontroller
- Coin sensor (count automatically)
- WiFi connection to API
- Real-time dashboard updates

### Multi-tenant
- Separate data per organization
- Role-based access control
- Location-based permissions

### Advanced Analytics
- Predictive inventory alerts
- Sales forecasting
- Location comparison reports
- Export to Excel/PDF

### Mobile App
- React Native (same codebase)
- Push notifications for low inventory
- Quick collection entry