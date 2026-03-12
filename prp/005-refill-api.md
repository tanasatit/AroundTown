# PRP-005: Refill API Endpoints

## Problem
When postcards are restocked into a machine, there is currently no way to record it. The `Refill` model already exists in the database schema. We need REST API endpoints to create, read, update, and delete refill records before building the UI in PRP-006.

## Scope
- **In scope**: Backend API only — CRUD for refills
- **Out of scope**: Refill entry form UI (PRP-006), inventory calculations on dashboard (will use refill data later)

---

## Database Schema (already exists)

```prisma
model Refill {
  id              Int      @id @default(autoincrement())
  refillDate      DateTime @db.Date
  machineLocation String   @db.VarChar(200)
  postcardsAdded  Int      // how many postcards were loaded
  postcardsBefore Int      // count before refill
  postcardsAfter  Int      // count after refill (= postcardsBefore + postcardsAdded)
  notes           String?
  createdBy       Int
  createdAt       DateTime @default(now())
}
```

**Business rule**: `postcardsAfter = postcardsBefore + postcardsAdded` — always enforced server-side, never trust client.

---

## Requirements

### Functional Requirements

#### FR-1: Create Refill — `POST /api/refills`
- Accept: `refillDate`, `machineLocation`, `postcardsAdded`, `postcardsBefore`, `notes`
- Server calculates `postcardsAfter = postcardsBefore + postcardsAdded`
- Store in DB with `createdBy` from session
- Return created refill

#### FR-2: List Refills — `GET /api/refills`
- Paginated list (default 10 per page)
- Filters: `location`, `startDate`, `endDate`
- Default sort: `refillDate DESC`
- Include user info

#### FR-3: Get Single Refill — `GET /api/refills/[id]`
- Return one refill by ID
- 404 if not found

#### FR-4: Update Refill — `PUT /api/refills/[id]`
- Accept partial update (all fields optional)
- Recalculate `postcardsAfter` if `postcardsBefore` or `postcardsAdded` changes
- Return updated refill

#### FR-5: Delete Refill — `DELETE /api/refills/[id]`
- Hard delete
- Return success message
- 404 if not found

### Non-Functional Requirements

- All endpoints require auth (401 if no session)
- Zod validation for all inputs
- 400 with field errors on invalid input
- 500 with generic message on unexpected errors

---

## Validation Rules

```typescript
refillDate:      string (date, not in future)
machineLocation: string (3–200 chars, must be one of MACHINE_LOCATIONS)
postcardsAdded:  integer >= 1  (must add at least 1)
postcardsBefore: integer >= 0
notes:           string (optional)
// postcardsAfter: calculated, not accepted from client
```

---

## API Specification

### POST /api/refills

**Request Body**:
```json
{
  "refillDate": "2026-03-04",
  "machineLocation": "Rare Aroon - Ground Floor",
  "postcardsAdded": 200,
  "postcardsBefore": 50,
  "notes": "Weekly restock"
}
```

**Success Response (201)**:
```json
{
  "id": 1,
  "refillDate": "2026-03-04T00:00:00Z",
  "machineLocation": "Rare Aroon - Ground Floor",
  "postcardsAdded": 200,
  "postcardsBefore": 50,
  "postcardsAfter": 250,
  "notes": "Weekly restock",
  "createdBy": 1,
  "createdAt": "2026-03-04T10:00:00Z",
  "user": { "id": 1, "name": "Admin", "email": "admin@seeyou.com" }
}
```

**Error Responses**: 400 (validation), 401 (auth), 500 (server)

---

### GET /api/refills

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `location` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Success Response (200)**:
```json
{
  "refills": [ /* array of refill objects with user */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /api/refills/[id]

**Success (200)**: Single refill object
**Errors**: 401, 404, 500

---

### PUT /api/refills/[id]

**Request Body**: Same as POST (all fields optional)
**Recalculates** `postcardsAfter` when `postcardsBefore` or `postcardsAdded` is updated
**Success (200)**: Updated refill
**Errors**: 400, 401, 404, 500

---

### DELETE /api/refills/[id]

**Success (200)**:
```json
{ "message": "Refill deleted successfully" }
```
**Errors**: 401, 404, 500

---

## Implementation Plan

### Step 1: Create Validation Schema
**File**: `lib/validations/refill.ts`

```typescript
export const createRefillSchema = z.object({
  refillDate:      z.string().refine(date => new Date(date) <= new Date(), ...),
  machineLocation: z.string().min(3).max(200),
  postcardsAdded:  z.number().int().min(1),
  postcardsBefore: z.number().int().min(0),
  notes:           z.string().optional(),
});

export const updateRefillSchema = createRefillSchema.partial();

export const listRefillsQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).default(1)...,
  limit:     z.coerce.number().int().min(1).max(100).default(10)...,
  location:  z.string().nullish()...,
  startDate: z.string().nullish()...,
  endDate:   z.string().nullish()...,
});
```

### Step 2: Create Route Handlers
**Files**:
- `app/api/refills/route.ts` — POST, GET
- `app/api/refills/[id]/route.ts` — GET, PUT, DELETE

Follow the same pattern as `app/api/collections/`.

---

## Files to Create

### New Files
1. `lib/validations/refill.ts` — Zod schemas
2. `app/api/refills/route.ts` — POST, GET handlers
3. `app/api/refills/[id]/route.ts` — GET, PUT, DELETE handlers

---

## Acceptance Criteria

- [ ] POST /api/refills creates a refill record
- [ ] POST calculates `postcardsAfter` server-side (ignores client value)
- [ ] POST validates `postcardsAdded >= 1`
- [ ] POST validates date not in future
- [ ] GET /api/refills returns paginated list
- [ ] GET supports `location`, `startDate`, `endDate` filters
- [ ] GET /api/refills/[id] returns single refill
- [ ] GET /api/refills/[id] returns 404 for missing record
- [ ] PUT /api/refills/[id] updates and recalculates `postcardsAfter`
- [ ] DELETE /api/refills/[id] removes record
- [ ] All endpoints return 401 without auth
- [ ] Build passes, no TypeScript errors

---

## Dependencies
- ✅ Refill model in DB schema (already exists)
- ✅ Prisma client configured
- ✅ NextAuth session available
- ✅ Pattern established in PRP-001 (collections API)

---

## Questions Locked Before Implementation

1. **`postcardsAfter`**: Always calculated server-side (`before + added`) ✓
2. **`postcardsAdded` minimum**: Must be >= 1 (a refill with 0 postcards makes no sense) ✓
3. **Location validation**: Accept any string 3–200 chars (same as collections, not restricted to MACHINE_LOCATIONS constant so new locations can be added) ✓
4. **Sort**: Always `refillDate DESC`, no sort params needed (simpler than collections) ✓
5. **Hard delete**: Yes, same as collections ✓

---

## Estimated Time
**1.5 hours**

---

**Previous PRP**: PRP-004 (Collections History Table) ✅
**Next PRP**: PRP-006 (Refill Entry Form)
