# PRP-004: Collections History Table

## Problem
Users need to view all past collection records in a table, filter by location/week/date, and drill into full details for any single collection. Currently there is no way to see historical data through the UI.

## Scope
- **In scope**: History page, filterable/paginated table, detail modal, sort by column
- **Out of scope**: Edit collection (future), export to Excel (PRP-008), charts (PRP-007)

---

## Requirements

### Functional Requirements

#### FR-1: History Page
- Create page at `app/(dashboard)/collections/page.tsx` → URL: `/collections`
- Protected route via existing `(dashboard)` layout
- Server component — reads filters from URL search params, fetches from DB directly

#### FR-2: Table Columns
| Column | Value | Sortable |
|--------|-------|---------|
| Date | collectionDate (formatted) | Yes |
| Round | roundNumber | No |
| Week | weekNumber | Yes |
| Location | machineLocation (short name) | No |
| Coins | machineCoins10baht | No |
| Postcards Sold | derived: coins / 4 | No |
| Revenue | derived: ฿ amount | Yes |
| Profit | derived: ฿ amount | Yes |
| Balance | exchangeBalanced badge | No |
| Actions | View / Delete buttons | No |

#### FR-3: Sorting
- Sort by: `date` (default), `week`, `revenue`, `profit`
- Sort order: `desc` (default), `asc`
- Clicking a sortable column header toggles asc/desc
- Sort state lives in URL search params (`sort`, `order`)

#### FR-4: Filters
Three filter controls above the table:
1. **Location** — Select dropdown (all locations from `MACHINE_LOCATIONS` constant + "All")
2. **Week** — Number input (leave blank for all weeks)
3. **Date range** — Start date + End date inputs

Filter state lives in URL search params. Changing a filter resets page to 1.

#### FR-5: Pagination
- Show 10 rows per page
- Previous / Next buttons
- "Showing X–Y of Z collections" label
- Pagination state in URL search param `page`

#### FR-6: Detail Modal
- Clicking "View" on a row opens a Dialog
- Shows full collection breakdown:
  - Header: date, round, location
  - Machine section: coins, machine total, postcards sold
  - Exchange box section: all 9 denominations + total + balance status
  - Summary: revenue, cost, profit
  - Footer: postcards remaining, cost per postcard, notes, created by, created at

#### FR-7: Delete
- "Delete" button on each row
- Show confirm dialog before deleting
- On confirm: call `DELETE /api/collections/[id]`
- On success: remove row, show toast
- On error: show error toast

#### FR-8: Empty State
- If no collections match filters: "No collections found" with a "Clear filters" link
- If no collections at all: "No collections yet" with a "Record First Collection" button

### Non-Functional Requirements

#### NFR-1: Performance
- All filtering/sorting/pagination done server-side via DB query
- No client-side data manipulation

#### NFR-2: UX
- Filters are URL-driven (shareable, bookmarkable, survives refresh)
- Delete requires confirmation (cannot be undone)
- Loading state: table skeleton while page navigates

---

## API Changes

### `GET /api/collections` — Add sort params

Add two new optional query params to `listCollectionsQuerySchema`:

```typescript
sort: z.enum(['date', 'week', 'revenue', 'profit']).default('date'),
order: z.enum(['asc', 'desc']).default('desc'),
```

Since `revenue` and `profit` are derived (not DB columns), sort by `machineCoins10baht` as proxy (revenue and profit are proportional to coins).

Updated Prisma `orderBy`:
```typescript
const orderByMap = {
  date:    { collectionDate: order },
  week:    { weekNumber: order },
  revenue: { machineCoins10baht: order },
  profit:  { machineCoins10baht: order },
};
```

---

## Data Flow

```
URL search params
  → app/(dashboard)/collections/page.tsx (server component)
    → prisma.collection.findMany (direct DB call, not via API)
      → <HistoryTable> (client component, receives data + pagination + filters as props)
        → filter change → router.push (new URL with updated params)
        → sort click   → router.push
        → page change  → router.push
        → view click   → open <CollectionDetailModal> (uses data already in row)
        → delete click → open confirm dialog → DELETE /api/collections/[id]
```

> **Note**: Page reads DB directly (same pattern as PRP-003 dashboard). The existing `GET /api/collections` is kept for the delete/detail UX which needs client-side interactivity.

---

## UI Design

### Page Layout
```
+--------------------------------------------------+
|  Collections                [+ New Collection]  |
+--------------------------------------------------+
|  [Location: All v]  [Week: ___]  [From: ___] [To: ___]  [Clear] |
+--------------------------------------------------+
|  Date ↓  | Rnd | Wk | Location | Coins | Sold | Revenue | Profit | Balance | Actions |
|----------|-----|----|----------|-------|------|---------|--------|---------|---------|
| 04/03/26 |  1  |  9 | Rare...  |  300  |  75  | ฿3,000  | ฿1,967 | ✓      | [View][Del] |
| 02/03/26 |  2  |  8 | CW...    |  240  |  60  | ฿2,400  | ฿1,573 | ✓      | [View][Del] |
+--------------------------------------------------+
|  Showing 1–10 of 24          [< Prev]  [Next >] |
+--------------------------------------------------+
```

### Detail Modal
```
+------------------------------------------+
|  Collection — 04 Mar 2026, Round 1  [x]  |
|  Rare Aroon - Ground Floor               |
+------------------------------------------+
|  MACHINE                                 |
|  Coins: 300  |  Total: ฿3,000            |
|  Postcards Sold: 75                      |
+------------------------------------------+
|  EXCHANGE BOX                            |
|  1฿: 50  2฿: 100  5฿: 80  10฿: 500     |
|  20฿: 30  50฿: 20  100฿: 25            |
|  500฿: 4  1000฿: 0                      |
|  Total: ฿12,000  [✓ Balanced]           |
+------------------------------------------+
|  SUMMARY                                 |
|  Revenue: ฿3,000 | Cost: ฿1,032 | Profit: ฿1,967 |
+------------------------------------------+
|  Postcards remaining: 525                |
|  Cost/postcard: ฿13.766                 |
|  Notes: —                               |
|  Created by: admin · 04 Mar 2026 10:30  |
+------------------------------------------+
```

---

## Implementation Plan

### Step 1: Install shadcn components
```bash
npx shadcn@latest add table dialog alert-dialog
```

### Step 2: Update validation schema
**File**: `lib/validations/collection.ts`
Add `sort` and `order` fields to `listCollectionsQuerySchema`.

### Step 3: Update GET /api/collections
**File**: `app/api/collections/route.ts`
Add `orderBy` logic using the sort/order params.

### Step 4: Create server-side data fetcher
**File**: `lib/collections.ts`
Extract `getCollections(params)` function for direct DB access from the page (same pattern as `lib/stats.ts`).

### Step 5: Create page
**File**: `app/(dashboard)/collections/page.tsx`
Server component — reads `searchParams`, calls `getCollections()`, passes data to `<HistoryTable>`.

### Step 6: Create HistoryTable client component
**File**: `components/collections/history-table.tsx`
- Renders shadcn `Table`
- Filter controls (location select, week input, date inputs)
- Sortable column headers
- Pagination controls
- Calls `router.push` on filter/sort/page changes

### Step 7: Create CollectionDetailModal
**File**: `components/collections/collection-detail-modal.tsx`
- shadcn `Dialog`
- Receives collection row data (already fetched) as prop
- Full breakdown display

### Step 8: Create DeleteConfirmDialog
**File**: `components/collections/delete-confirm-dialog.tsx`
- shadcn `AlertDialog`
- Calls `DELETE /api/collections/[id]`
- Shows toast on result

---

## Files to Create

### New Files
1. `lib/collections.ts` — `getCollections(params)` direct DB helper
2. `app/(dashboard)/collections/page.tsx` — History page
3. `components/collections/history-table.tsx` — Main table component
4. `components/collections/collection-detail-modal.tsx` — Detail dialog
5. `components/collections/delete-confirm-dialog.tsx` — Delete confirmation

### Modified Files
1. `lib/validations/collection.ts` — Add `sort`, `order` to list schema
2. `app/api/collections/route.ts` — Add `orderBy` using sort params

---

## Acceptance Criteria

- [x] `/collections` page renders with table
- [x] Table shows all required columns
- [x] Sort by Date, Week, Revenue, Profit works (click header)
- [x] Sort order toggles asc/desc on repeated click
- [x] Filter by location works
- [x] Filter by week number works
- [x] Filter by date range works
- [x] Filters are reflected in URL (shareable)
- [x] Pagination works (Previous/Next, showing X–Y of Z)
- [x] Clicking "View" opens detail modal with full data
- [x] Clicking "Delete" shows confirm dialog
- [x] Confirming delete removes row and shows toast
- [x] Empty state shown when no results match filters
- [x] "Clear filters" link resets all filters
- [x] No TypeScript errors, build passes

---

## Testing Checklist

### Happy Path
- [ ] Navigate to `/collections` — table loads
- [ ] Filter by location — rows update
- [ ] Filter by week — rows update
- [ ] Set date range — rows update
- [ ] Click Date header — sorts ascending/descending
- [ ] Click Revenue header — sorts ascending/descending
- [ ] Navigate to page 2 — next 10 rows load
- [ ] Click View → modal opens with correct data
- [ ] Click Delete → confirm → row removed, toast shown

### Edge Cases
- [ ] No collections at all → empty state with CTA
- [ ] Filter returns no results → "no collections found" + clear link
- [ ] Delete last item on page 2 → go back to page 1
- [ ] Filter with date range that has no data → empty state

---

## Dependencies
- ✅ PRP-001 (Collection API) — `GET /api/collections`, `DELETE /api/collections/[id]`
- ✅ PRP-002 (Collection Form) — test data available
- ✅ `lib/calculations.ts` — `calculateCollectionMetrics` for derived columns
- ✅ `lib/constants.ts` — `MACHINE_LOCATIONS` for filter dropdown
- shadcn `table`, `dialog`, `alert-dialog` (to install)

---

## Questions Locked Before Implementation

1. **Sort proxy**: `revenue` and `profit` sort by `machineCoins10baht` (proportional) ✓
2. **Rows per page**: 10 (fixed, no page size selector) ✓
3. **Fetch strategy**: Server component reads DB directly, client actions hit API ✓
4. **Edit collection**: Out of scope for this PRP ✓
5. **Bulk delete**: Out of scope ✓
6. **Detail modal data**: Use already-fetched row data (no extra API call) ✓

---

## Estimated Time
**3 hours**

---

**Previous PRP**: PRP-003 (Dashboard Stats Cards) ✅
**Next PRP**: PRP-005 (Refill API Endpoints)
