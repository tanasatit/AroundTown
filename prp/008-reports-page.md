# PRP-008: Reports Page

## Problem
There is no way to view aggregated business performance over time. The dashboard shows only this week vs last week. Users need a dedicated Reports page that summarises revenue, profit, and postcards sold grouped by week and by location — with an Excel export for record-keeping.

## Scope
- **In scope**: `/reports` page, weekly summary table, location comparison table, Excel export (`.xlsx`)
- **Out of scope**: Monthly grouping, custom date ranges, PDF export, charts (done in PRP-007)

---

## Requirements

### Functional Requirements

#### FR-1: Reports Page
- New route: `app/(dashboard)/reports/page.tsx` → URL: `/reports`
- Protected route via existing `(dashboard)` layout auth
- Server component; fetches all data server-side

#### FR-2: Weekly Summary Table
Shows one row per week number, aggregated across all locations:

| Column | Value |
|--------|-------|
| Week | Week number (e.g. "Week 10") |
| Collections | Count of collection records |
| Postcards Sold | Sum of postcardsSold |
| Revenue | Sum of revenue (฿) |
| Cost | Sum of cost (฿) |
| Profit | Sum of profit (฿) |

- Sorted by week descending (most recent first)
- Only weeks that have at least 1 collection
- Show all weeks (no pagination — data volume is small)

#### FR-3: Location Comparison Table
Shows one row per machine location, aggregated across all time:

| Column | Value |
|--------|-------|
| Location | Machine location name |
| Collections | Count |
| Postcards Sold | Sum |
| Revenue | Sum (฿) |
| Cost | Sum (฿) |
| Profit | Sum (฿) |

- Sorted by profit descending

#### FR-4: Totals Row
Both tables have a **Totals** row at the bottom showing column sums. Bold/highlighted.

#### FR-5: Excel Export
- Button: "Export to Excel" — downloads a `.xlsx` file
- Filename: `seeyou-report-YYYY-MM-DD.xlsx`
- Two sheets: `Weekly Summary` and `By Location`
- Each sheet mirrors the table data including the Totals row
- Currency values formatted as numbers (not strings) so Excel can sum them
- Client-side generation using `xlsx` (SheetJS) library — no server API needed

#### FR-6: Empty State
If no collections exist at all, show a friendly message: "No collections recorded yet. Record your first collection to generate reports."

### Non-Functional Requirements

#### NFR-1: No New API Endpoint
Fetch data directly in the server component using a new `getReportsData()` function in `lib/reports.ts`. No `/api/reports` endpoint needed.

#### NFR-2: Performance
- Single Prisma query fetching all collections, grouped in JS
- Must complete < 1s for up to 500 rows (expected data volume is tiny)

#### NFR-3: Style
- Dark card theme (shadcn `Card`)
- Tables use shadcn `Table` components
- Profit column: green text (`text-green-500`)
- Cost column: red text (`text-destructive`)
- Revenue column: gold text (`text-thai-gold`)
- Totals row: slightly highlighted background (`bg-muted/50`), bold text

---

## Data Shape

### `ReportsData` (from `lib/reports.ts`)

```typescript
export interface WeekSummaryRow {
  weekNumber: number;
  collections: number;
  postcardsSold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface LocationRow {
  location: string;
  collections: number;
  postcardsSold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ReportsData {
  byWeek: WeekSummaryRow[];      // sorted by weekNumber desc
  byLocation: LocationRow[];     // sorted by profit desc
  totals: {
    collections: number;
    postcardsSold: number;
    revenue: number;
    cost: number;
    profit: number;
  };
  isEmpty: boolean;
}
```

---

## UI Design

### Page Layout
```
+--------------------------------------------------+
|  Reports                  [Export to Excel ↓]   |
|  All-time summary                                |
|                                                  |
|  Weekly Summary                                  |
|  +------+-------+----------+--------+------+----+
|  | Week | Coll. | Postcards| Rev    | Cost | P  |
|  +------+-------+----------+--------+------+----+
|  | Wk11 |   4   |   300    | ฿12,000| ...  | ...|
|  | Wk10 |   4   |   280    | ฿11,200| ...  | ...|
|  | ...  |  ...  |   ...    | ...    | ...  | ...|
|  +------+-------+----------+--------+------+----+
|  | Total|  ...  |   ...    | ...    | ...  | ...|  ← bold
|  +------+-------+----------+--------+------+----+
|                                                  |
|  By Location                                     |
|  +-----------+-------+----------+--------+--+---+
|  | Location  | Coll. | Postcards| Rev    |..| P |
|  +-----------+-------+----------+--------+--+---+
|  | Rare Aroon|  ...  |   ...    | ...    |..| ..|
|  | Cent World|  ...  |   ...    | ...    |..| ..|
|  +-----------+-------+----------+--------+--+---+
|  | Total     |  ...  |   ...    | ...    |..| ..|
|  +-----------+-------+----------+--------+--+---+
+--------------------------------------------------+
```

### Export Button
- Outlined button with download icon, top-right of page header
- Client component wrapping just the button (rest of page stays server)
- On click: generates xlsx in browser memory, triggers download

---

## Implementation Plan

### Step 1: Install xlsx library
```
npm install xlsx
```

### Step 2: Data Fetching Logic
**File**: `lib/reports.ts` (new file)

```typescript
export async function getReportsData(): Promise<ReportsData> {
  const rows = await prisma.collection.findMany({ orderBy: { collectionDate: 'desc' } });

  if (rows.length === 0) return { byWeek: [], byLocation: [], totals: {...zeros}, isEmpty: true };

  // Group by weekNumber → WeekSummaryRow[]
  // Group by machineLocation → LocationRow[]
  // Calculate totals
  // Use calculateCollectionMetrics(row) for each row's numbers
}
```

### Step 3: Reports Page
**File**: `app/(dashboard)/reports/page.tsx` (new file)

- Server component
- Calls `getReportsData()`
- Renders page header + `<ExportButton>` client component + two table sections

### Step 4: Weekly Summary Table
**File**: `components/reports/weekly-summary-table.tsx` (new file)

- Receives `byWeek: WeekSummaryRow[]` + `totals`
- shadcn `Table` with `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Totals row at bottom with `bg-muted/50 font-semibold`

### Step 5: Location Table
**File**: `components/reports/location-table.tsx` (new file)

- Receives `byLocation: LocationRow[]` + `totals`
- Same table structure

### Step 6: Export Button
**File**: `components/reports/export-button.tsx` (new file)

- `"use client"` component
- Receives `data: ReportsData` as props
- On click: uses `xlsx` to build workbook with 2 sheets, triggers download
- Shows a brief loading state while generating

### Step 7: Navigation Link
**File**: `app/(dashboard)/layout.tsx`

- The current layout has a header with the brand name and user info, but no nav links yet (full nav is PRP-009)
- Add a minimal nav row to the header with links: `Dashboard`, `Collections`, `Reports`
- This will be superseded/expanded by PRP-009 — keep it simple for now

---

## Files to Create

1. `lib/reports.ts` — `getReportsData()` + all types
2. `app/(dashboard)/reports/page.tsx` — Reports page
3. `components/reports/weekly-summary-table.tsx` — Weekly table
4. `components/reports/location-table.tsx` — Location table
5. `components/reports/export-button.tsx` — Client-side Excel export

## Files to Modify

1. `app/(dashboard)/layout.tsx` — Add Reports nav link

---

## Acceptance Criteria

- [ ] `/reports` accessible after login; redirects to `/login` if not authenticated
- [ ] Weekly Summary table shows one row per week (desc), all columns correct
- [ ] By Location table shows one row per location, all columns correct
- [ ] Totals row at bottom of each table matches manual sum
- [ ] Profit column is green, Cost is red, Revenue is gold
- [ ] "Export to Excel" downloads `seeyou-report-YYYY-MM-DD.xlsx`
- [ ] Excel file has 2 sheets: `Weekly Summary` and `By Location`
- [ ] Excel currency values are numbers, not strings
- [ ] Empty state shown when no collections exist
- [ ] Reports link appears in dashboard navigation
- [ ] No TypeScript errors
- [ ] Build passes

---

## Testing Checklist

### Happy Path
- [ ] Login → click Reports in nav → page loads with data
- [ ] Weekly table rows match manually summed collections
- [ ] Click Export → file downloads → open in Excel → 2 sheets with correct data

### Edge Cases
- [ ] No collections → empty state shown, Export button hidden
- [ ] Single week of data → 1 row in Weekly table
- [ ] Single location → 1 row in Location table
- [ ] Week with 1 collection → correct single-row sums

### Auth
- [ ] `/reports` without session → redirect to `/login`

---

## Questions to Lock Before Implementation

1. **Nav location**: Current layout has no nav links yet (PRP-009 will do full nav). For PRP-008, add a minimal inline nav row (`Dashboard | Collections | Reports`) to the header — PRP-009 will replace it with the full sidebar/nav
2. **xlsx library**: Client-side SheetJS (`xlsx`) — no server endpoint needed
3. **Grouping scope**: All-time (no year filter) — system has < 1 year of data
4. **Pagination**: None — all rows shown, volume is small
5. **Week label format**: "Week N" in display, raw number in Excel

---

## Dependencies
- ✅ PRP-001 — collection data in DB
- ✅ PRP-003 — `getDashboardStats` pattern + `calculateCollectionMetrics` to reuse
- ✅ `lib/calculations.ts` — `calculateCollectionMetrics`
- `xlsx` npm package (new dependency)
- shadcn `Table` component — check if installed: `components/ui/table.tsx`

---

## Estimated Time
**4 hours**

---

**Previous PRP**: PRP-007 (Dashboard Charts) ✅
**Next PRP**: PRP-009 (Navigation & Layout)
