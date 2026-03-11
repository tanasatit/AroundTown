# PRP-007: Dashboard Charts

## Problem
The dashboard currently shows 4 stat cards (Revenue, Postcards Sold, Profit, Inventory) for the current week only. There is no way to see trends over time. Users need visual charts to understand business performance across multiple weeks at a glance.

## Scope
- **In scope**: 2 charts on the dashboard, new chart data API endpoint, recharts integration
- **Out of scope**: Reports page (PRP-008), per-location breakdown charts, date range picker, export

---

## Requirements

### Functional Requirements

#### FR-1: Two Charts on Dashboard
Add 2 charts below the stat cards:

| Chart | Type | X-axis | Y-axis | Data range |
|-------|------|--------|--------|------------|
| Revenue & Profit | Area chart (2 series) | Week number | Baht (฿) | Last 8 weeks |
| Postcards Sold | Bar chart | Week number | Count | Last 8 weeks |

#### FR-2: Data Range
- Show last 8 weeks of data (including current week)
- Weeks with no collections show 0 for all values
- Week numbers on X-axis (e.g. "Wk 10", "Wk 11")

#### FR-3: Chart Data API
- New endpoint: `GET /api/stats/charts`
- Returns weekly aggregated data for the last 8 weeks
- Requires auth

#### FR-4: Loading State
- Skeleton placeholder while chart data loads (same height as chart)
- Use `Suspense` + skeleton component pattern (same as stat cards)

#### FR-5: Empty State
- If fewer than 2 weeks of data exist, show a muted message: "Not enough data yet — charts appear after 2 weeks of collections."
- Don't render charts in this case

### Non-Functional Requirements

#### NFR-1: Library
- Use **recharts** (already a common shadcn/ui pairing, no new dependency conflicts)
- Use shadcn/ui `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from `components/ui/chart` (shadcn chart primitives)

#### NFR-2: Theme
- Follow dark dashboard theme
- Revenue series: `#D4AF37` (thai-gold)
- Profit series: `#22c55e` (green-500)
- Postcards sold bars: `#D4AF37` (thai-gold)
- Grid lines: muted, subtle
- Tooltip: dark background, values formatted with ฿ symbol

#### NFR-3: Performance
- Chart data query must complete < 500ms
- Fetch chart data separately from stat cards (independent Suspense boundary)

---

## API Specification

### GET /api/stats/charts

**Success Response (200)**:
```json
{
  "weeks": [
    { "weekNumber": 4, "revenue": 0, "profit": 0, "postcardsSold": 0 },
    { "weekNumber": 5, "revenue": 9600, "profit": 7095.84, "postcardsSold": 240 },
    { "weekNumber": 6, "revenue": 0, "profit": 0, "postcardsSold": 0 },
    { "weekNumber": 7, "revenue": 8800, "profit": 6497.12, "postcardsSold": 220 },
    { "weekNumber": 8, "revenue": 9600, "profit": 7095.84, "postcardsSold": 240 },
    { "weekNumber": 9, "revenue": 10400, "profit": 7694.56, "postcardsSold": 260 },
    { "weekNumber": 10, "revenue": 11200, "profit": 8293.28, "postcardsSold": 280 },
    { "weekNumber": 11, "revenue": 12000, "profit": 8869.80, "postcardsSold": 300 }
  ],
  "hasEnoughData": true
}
```

- Always returns exactly 8 entries (one per week, filling 0s for missing weeks)
- `hasEnoughData`: true if 2 or more weeks have at least 1 collection

**Error Responses**:
- 401: Unauthorized
- 500: Server error

---

## UI Design

### Dashboard Layout (after PRP-007)
```
+--------------------------------------------------+
|  Dashboard                    [+ New Collection] |
|  Week 11                                         |
|                                                  |
|  [Revenue] [Postcards] [Profit] [Inventory]      |  ← stat cards (existing)
|                                                  |
|  +----------------------+  +-------------------+ |
|  | Revenue & Profit     |  | Postcards Sold    | |
|  | (area chart)         |  | (bar chart)       | |
|  |  ___                 |  |     █             | |
|  | /   \___/\___        |  |   █ █   █ █ █ █  | |
|  +----------------------+  +-------------------+ |
+--------------------------------------------------+
```

- Charts sit in a `grid grid-cols-1 lg:grid-cols-2 gap-4`
- Each chart card: `Card` with `CardHeader` (title) + `CardContent` (chart, height 240px)

### Chart Card Design
```
+--------------------------------+
| Revenue & Profit        [icon] |
|                                |
|  ── Revenue  ── Profit         |  ← legend
|                                |
|  [area chart, h-60]            |
|                                |
+--------------------------------+
```

---

## Implementation Plan

### Step 1: Install recharts (if not already present)
Check `package.json`. If missing, run:
```
npm install recharts
```
shadcn chart component may already be installed — check `components/ui/chart.tsx`.

### Step 2: Chart Data Logic
**File**: `lib/stats.ts` (add new function)

```typescript
export async function getChartData(): Promise<ChartData> {
  const currentWeek = getCurrentWeekNumber();
  const startWeek = currentWeek - 7; // 8 weeks total

  const rows = await prisma.collection.findMany({
    where: { weekNumber: { gte: startWeek, lte: currentWeek } },
  });

  // Group by weekNumber, sum metrics
  // Fill missing weeks with 0s
  // Return sorted array of 8 entries
}
```

### Step 3: Charts API Endpoint
**File**: `app/api/stats/charts/route.ts` (new file)

- Auth check
- Call `getChartData()`
- Return JSON

### Step 4: Dashboard Charts Component
**File**: `components/dashboard/dashboard-charts.tsx` (new file)

- Receives `ChartData` as props
- Renders 2 chart cards in a 2-column grid
- Handles `hasEnoughData === false` empty state

### Step 5: Revenue & Profit Area Chart
Inside `dashboard-charts.tsx`:
- `AreaChart` from recharts
- Two `Area` series: revenue (gold) and profit (green)
- `XAxis`: weekNumber formatted as "Wk N"
- `YAxis`: hidden (values in tooltip)
- `ChartTooltip` with currency formatting

### Step 6: Postcards Sold Bar Chart
Inside `dashboard-charts.tsx`:
- `BarChart` from recharts
- Single `Bar` series: postcardsSold (gold)
- `XAxis`: weekNumber formatted as "Wk N"
- `YAxis`: hidden
- `ChartTooltip` with count formatting

### Step 7: Skeleton
**File**: `components/dashboard/dashboard-charts-skeleton.tsx` (new file)

- 2-column grid of 2 skeleton cards, each ~300px tall

### Step 8: Wire into Dashboard Page
**File**: `app/(dashboard)/page.tsx`

Add below `<Suspense>` for stat cards:
```tsx
async function DashboardCharts() {
  const data = await getChartData();
  return <DashboardChartsComponent data={data} />;
}

// In JSX:
<Suspense fallback={<DashboardChartsSkeleton />}>
  <DashboardCharts />
</Suspense>
```

---

## Files to Create

1. `app/api/stats/charts/route.ts` — Charts data API
2. `components/dashboard/dashboard-charts.tsx` — Both chart cards
3. `components/dashboard/dashboard-charts-skeleton.tsx` — Loading skeleton

## Files to Modify

1. `lib/stats.ts` — Add `getChartData()` function + `ChartData` type
2. `app/(dashboard)/page.tsx` — Add charts Suspense block below stat cards

---

## Acceptance Criteria

- [ ] Dashboard shows 2 charts below stat cards
- [ ] Revenue & Profit area chart displays last 8 weeks, with gold/green series
- [ ] Postcards Sold bar chart displays last 8 weeks in gold
- [ ] Weeks with no data show 0 (no gaps / crashes)
- [ ] X-axis shows "Wk N" labels
- [ ] Tooltip shows formatted values (฿ for currency, plain count for postcards)
- [ ] Charts are in 2 columns on desktop, 1 column on mobile
- [ ] Skeleton shows while loading
- [ ] If fewer than 2 weeks of data: empty state message shown, no charts rendered
- [ ] `GET /api/stats/charts` returns 401 if not authenticated
- [ ] No TypeScript errors
- [ ] Build passes

---

## Testing Checklist

### Happy Path
- [ ] Dashboard with 8+ weeks of data → 2 charts visible, correct values
- [ ] Hover tooltip → shows week number + formatted values

### Edge Cases
- [ ] 0 collections in DB → empty state shown
- [ ] Only 1 week of data → empty state shown
- [ ] Some weeks missing data → those weeks show 0, chart continues
- [ ] Current week has 0 collections → last bar/area is 0

### Auth
- [ ] `GET /api/stats/charts` without session → 401

---

## Questions to Lock Before Implementation

1. **Chart library**: recharts via shadcn chart primitives — confirm `components/ui/chart.tsx` exists or needs `npx shadcn add chart`
2. **Week range**: Last 8 weeks (current - 7 to current) — fixed, no user selector
3. **YAxis**: Hidden (values only in tooltip) to save space
4. **Legend**: Inline legend above chart area or recharts `Legend` component
5. **Separate API endpoint**: Yes, `GET /api/stats/charts` — keep charts data independent from stats cards

---

## Dependencies
- ✅ PRP-001 — collection data in DB
- ✅ PRP-003 — dashboard page and `getDashboardStats` pattern to follow
- recharts npm package (check if installed)
- shadcn `chart` component (`components/ui/chart.tsx`)

---

## Estimated Time
**3 hours**

---

**Previous PRP**: PRP-006 (Refill Form — integrated into collections/new) ✅
**Next PRP**: PRP-008 (Reports Page)
