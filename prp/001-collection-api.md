# PRP-001: Collection API Endpoints

## Problem
We need a reliable backend API to create, read, update, and delete collection records. The API must enforce business rules, validate inputs, and integrate calculation logic.

## Scope
- **In scope**: Backend API only
- **Out of scope**: Frontend UI, charts, reports

## Requirements

### Functional Requirements

#### FR-1: Create Collection
- Accept collection data via POST /api/collections
- Validate all inputs (dates, coin counts, location)
- Check for duplicate collection (same date + round + location)
- Calculate derived values (postcards sold, revenue, profit)
- Store in database
- Return complete collection with calculations

#### FR-2: List Collections
- GET /api/collections returns paginated list
- Support filters: week, location, date range
- Default sort: newest first (collectionDate DESC)
- Include user info (who created it)
- Return pagination metadata

#### FR-3: Get Single Collection
- GET /api/collections/[id] returns one collection
- Include calculated values
- Include user info
- Return 404 if not found

#### FR-4: Update Collection
- PUT /api/collections/[id] updates existing
- Validate new data
- Recalculate derived values
- Return updated collection

#### FR-5: Delete Collection
- DELETE /api/collections/[id] removes record
- Return success message
- Return 404 if not found

### Non-Functional Requirements

#### NFR-1: Authentication
- All endpoints require valid NextAuth session
- Return 401 if not authenticated

#### NFR-2: Validation
- Use Zod schemas for input validation
- Return 400 with error details if invalid
- Validate business rules (coins divisible by 4, etc.)

#### NFR-3: Error Handling
- Try-catch all operations
- Log errors to console (Vercel logs)
- Return 500 for unexpected errors
- Never expose internal errors to client

#### NFR-4: Performance
- Queries should complete < 500ms
- Use Prisma's efficient queries
- Include only necessary relations

## Business Rules to Enforce

### Rule 1: Unique Collection
```typescript
// Cannot have duplicate: same date + round + location
UNIQUE (collectionDate, roundNumber, machineLocation)
```

### Rule 2: Input Validation
```typescript
// Machine coins must be divisible by 4
machineCoins10baht % 4 === 0

// All coin counts >= 0
all inputs >= 0 && isInteger

// Round number must be 1 or 2
roundNumber in [1, 2]

// Week number must be positive
weekNumber >= 1

// Date cannot be in future
collectionDate <= today()

// Location required (3-200 chars)
machineLocation.length >= 3 && <= 200
```

### Rule 3: Calculations
```typescript
// Calculate these server-side, don't trust client
postcardsSold = floor(machineCoins10baht / 4)
revenue = postcardsSold * 40
cost = postcardsSold * costPerPostcard
profit = revenue - cost
machineTotal = machineCoins10baht * 10
exchangeTotal = sum(all exchange inputs)
exchangeBalanced = abs(exchangeTotal - 12000) < 1
```

## API Specification

### POST /api/collections

**Request Body**:
```json
{
  "collectionDate": "2026-02-05",
  "roundNumber": 1,
  "weekNumber": 6,
  "machineLocation": "Rare Aroon - Ground Floor",
  "machineCoins10baht": 300,
  "exchangeCoins1baht": 50,
  "exchangeCoins2baht": 100,
  "exchangeCoins5baht": 80,
  "exchangeCoins10baht": 500,
  "exchangeNote20baht": 30,
  "exchangeNote50baht": 20,
  "exchangeNote100baht": 25,
  "exchangeNote500baht": 4,
  "exchangeNote1000baht": 0,
  "postcardsRemaining": 525,
  "costPerPostcard": 13.766,
  "notes": "Optional note"
}
```

**Success Response (201)**:
```json
{
  "id": 1,
  "collectionDate": "2026-02-05T00:00:00Z",
  "roundNumber": 1,
  "weekNumber": 6,
  "machineLocation": "Rare Aroon - Ground Floor",
  "machineCoins10baht": 300,
  "exchangeCoins1baht": 50,
  // ... all exchange fields
  "postcardsRemaining": 525,
  "costPerPostcard": 13.766,
  "notes": "Optional note",
  "createdBy": 1,
  "createdAt": "2026-02-05T10:30:00Z",
  "updatedAt": "2026-02-05T10:30:00Z",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@seeyou.com"
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Unauthorized (no session)
- 409: Duplicate collection
- 500: Server error

---

### GET /api/collections

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `location` (optional: filter by machine location)
- `week` (optional: filter by week number)
- `startDate` (optional: filter from date)
- `endDate` (optional: filter to date)

**Success Response (200)**:
```json
{
  "collections": [
    {
      "id": 2,
      "collectionDate": "2026-02-05T00:00:00Z",
      // ... all fields including user
    },
    {
      "id": 1,
      "collectionDate": "2026-02-02T00:00:00Z",
      // ... all fields including user
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET /api/collections/[id]

**Success Response (200)**:
```json
{
  "id": 1,
  "collectionDate": "2026-02-05T00:00:00Z",
  // ... all fields including user
}
```

**Error Responses**:
- 401: Unauthorized
- 404: Collection not found
- 500: Server error

---

### PUT /api/collections/[id]

**Request Body**: Same as POST (all fields optional)

**Success Response (200)**: Same as POST

**Error Responses**:
- 400: Validation error
- 401: Unauthorized
- 404: Collection not found
- 500: Server error

---

### DELETE /api/collections/[id]

**Success Response (200)**:
```json
{
  "message": "Collection deleted successfully"
}
```

**Error Responses**:
- 401: Unauthorized
- 404: Collection not found
- 500: Server error

## Implementation Plan

### Step 1: Create Validation Schema
**File**: `lib/validations/collection.ts`

```typescript
import { z } from 'zod';

export const createCollectionSchema = z.object({
  collectionDate: z.string().refine(
    (date) => new Date(date) <= new Date(),
    { message: 'Collection date cannot be in the future' }
  ),
  roundNumber: z.number().int().min(1).max(2),
  weekNumber: z.number().int().min(1),
  machineLocation: z.string().min(3).max(200),
  
  machineCoins10baht: z.number().int().min(0)
    .refine((n) => n % 4 === 0, {
      message: 'Machine coins must be divisible by 4 (4 coins = 1 postcard)'
    }),
  
  exchangeCoins1baht: z.number().int().min(0).default(0),
  exchangeCoins2baht: z.number().int().min(0).default(0),
  exchangeCoins5baht: z.number().int().min(0).default(0),
  exchangeCoins10baht: z.number().int().min(0).default(0),
  exchangeNote20baht: z.number().int().min(0).default(0),
  exchangeNote50baht: z.number().int().min(0).default(0),
  exchangeNote100baht: z.number().int().min(0).default(0),
  exchangeNote500baht: z.number().int().min(0).default(0),
  exchangeNote1000baht: z.number().int().min(0).default(0),
  
  postcardsRemaining: z.number().int().min(0),
  costPerPostcard: z.number().min(1).max(50).default(13.766),
  notes: z.string().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();
```

### Step 2: Create API Route Handlers
**Files**: 
- `app/api/collections/route.ts` (POST, GET)
- `app/api/collections/[id]/route.ts` (GET, PUT, DELETE)

### Step 3: Integrate Calculation Logic
Use existing `lib/calculations.ts` to compute derived values

### Step 4: Test Each Endpoint
Use Postman or curl to test:
- Create collection (valid data)
- Create collection (invalid data)
- Create duplicate (should fail)
- List collections (with/without filters)
- Get single collection
- Update collection
- Delete collection
- Test without auth (should fail with 401)

## Acceptance Criteria

- [ ] POST /api/collections creates collection with valid data
- [ ] POST rejects invalid data with clear error messages
- [ ] POST prevents duplicate collections (same date + round + location)
- [ ] POST calculates postcardsSold, revenue, profit correctly
- [ ] GET /api/collections returns paginated list
- [ ] GET supports filtering by week, location, date
- [ ] GET /api/collections/[id] returns single collection
- [ ] PUT /api/collections/[id] updates collection
- [ ] DELETE /api/collections/[id] removes collection
- [ ] All endpoints require authentication (401 if not logged in)
- [ ] All endpoints handle errors gracefully (no crashes)
- [ ] Validation errors return 400 with helpful messages
- [ ] Machine coins must be divisible by 4 (enforced)
- [ ] Duplicate check works (409 error)

## Testing Checklist

### Happy Path
- [ ] Create collection with all required fields
- [ ] Create collection with optional notes
- [ ] List collections (default pagination)
- [ ] List collections (page 2)
- [ ] Filter by machine location
- [ ] Filter by week number
- [ ] Get single collection by ID
- [ ] Update collection notes
- [ ] Update collection coin counts
- [ ] Delete collection

### Error Cases
- [ ] Create without authentication → 401
- [ ] Create with invalid date (future) → 400
- [ ] Create with negative coins → 400
- [ ] Create with coins not divisible by 4 → 400
- [ ] Create duplicate (same date+round+location) → 409
- [ ] Get non-existent collection → 404
- [ ] Update non-existent collection → 404
- [ ] Delete non-existent collection → 404

### Edge Cases
- [ ] Create with 0 machine coins (valid: no sales)
- [ ] Create with 0 exchange box money (valid but warning)
- [ ] Create with very large numbers (10000+ coins)
- [ ] List with no collections (empty array)
- [ ] Pagination beyond last page (empty array)

## Dependencies
- ✅ Database schema (already pushed)
- ✅ Prisma client (already configured)
- ✅ NextAuth (already set up)
- ✅ Calculation logic (already in lib/calculations.ts)

## Files to Create/Modify

### New Files
1. `lib/validations/collection.ts` - Zod schemas
2. `app/api/collections/route.ts` - POST, GET handlers
3. `app/api/collections/[id]/route.ts` - GET, PUT, DELETE handlers

### Modified Files
None (this is new functionality)

## Estimated Time
**2 hours** (including testing)

## Questions to Lock Before Implementation

1. **Pagination defaults**: Page size of 10 is reasonable?
2. **Date handling**: Store as Date or string? → Date (Prisma @db.Date)
3. **Cost per postcard**: Always default 13.766 or allow custom? → Allow custom (already in schema)
4. **Delete**: Hard delete or soft delete? → Hard delete (can change later)
5. **Update**: Can update past collections or only recent? → Any collection (no time restriction)
6. **Calculated fields**: Return in API response? → Yes, calculate on-the-fly
7. **Exchange balance warning**: Enforce (400) or warn (200 with flag)? → Warn only (return exchangeBalanced: false)

## Notes for Context Engineer

Before implementing, confirm these decisions with Claude:
- Review API specification (any missing fields?)
- Review validation rules (too strict or too loose?)
- Review error handling approach
- Review testing checklist (anything missing?)

Then say: "Implement PRP-001. Follow claude.md and locked decisions."

## Success Criteria

✅ **Done when**:
- All 5 endpoints implemented
- All acceptance criteria met
- All tests pass
- No TypeScript errors
- No ESLint warnings
- Git committed with message: "Complete PRP-001: Collection API endpoints"

---

**Next PRP**: PRP-002 (Collection Entry Form) - builds UI on top of this API