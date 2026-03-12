# PRP-010: Loading & Error States

## Problem
The app has no route-level loading or error boundaries. If a server component's data fetch is slow, the browser shows a blank white screen until it resolves. If a fetch throws, the whole page crashes with an unhandled Next.js error screen. Users need proper skeleton loaders on each page and a graceful error fallback.

## Current State

### What already exists (do NOT recreate):
- `StatsCardsSkeleton` + `DashboardChartsSkeleton` — used inside `<Suspense>` on the dashboard
- shadcn `Skeleton` component installed at `components/ui/skeleton.tsx`
- Toast notifications via `sonner` for form-level errors

### What is missing:
| Route | loading.tsx | error.tsx |
|-------|-------------|-----------|
| `app/(dashboard)/` | ❌ | ❌ |
| `app/(dashboard)/collections/` | ❌ | ❌ |
| `app/(dashboard)/collections/new/` | ❌ | ❌ |
| `app/(dashboard)/reports/` | ❌ | ❌ |

---

## Scope
- **In scope**: `loading.tsx` for each dashboard route, one shared `error.tsx` at the `(dashboard)` layout level
- **Out of scope**: Form-level validation errors (already handled), API error toasts (already handled), 404 page

---

## Requirements

### Functional Requirements

#### FR-1: Route-Level Loading Files
Next.js automatically shows `loading.tsx` while the page's server component is fetching. Each dashboard route needs one.

| File | Content |
|------|---------|
| `app/(dashboard)/loading.tsx` | Reuse `StatsCardsSkeleton` + `DashboardChartsSkeleton` |
| `app/(dashboard)/collections/loading.tsx` | Table skeleton (5 rows × 6 columns) |
| `app/(dashboard)/collections/new/loading.tsx` | Form skeleton (2-column layout matching the form) |
| `app/(dashboard)/reports/loading.tsx` | Two table-card skeletons |

#### FR-2: Shared Error Boundary
One `error.tsx` at `app/(dashboard)/error.tsx` catches all unhandled errors across the dashboard.

- Must be a `"use client"` component (Next.js requirement)
- Shows: a card with an error icon, a short message, and a "Try again" button
- "Try again" calls `reset()` (provided by Next.js error boundary props)
- "Go to Dashboard" link as a secondary action

#### FR-3: No Duplicate Skeletons
The dashboard `loading.tsx` reuses the existing `StatsCardsSkeleton` and `DashboardChartsSkeleton` — do not create new ones.

---

## UI Design

### Error Page
```
+------------------------------------------+
|                                           |
|           ⚠  Something went wrong        |
|                                           |
|   An unexpected error occurred.          |
|   Please try again or return to the      |
|   dashboard.                             |
|                                           |
|   [Try Again]   [Go to Dashboard]        |
|                                           |
+------------------------------------------+
```
- Centered card, max-w-md
- Icon: `AlertTriangle` from lucide (red/destructive color)
- Buttons: "Try Again" = default, "Go to Dashboard" = outline

### Collections Loading Skeleton
```
+------------------------------------------+
| [filter bar skeleton]                    |
|                                           |
| [col header row - 6 cells]              |
| [row skeleton] × 5                       |
| [pagination skeleton]                   |
+------------------------------------------+
```

### Collections New Loading Skeleton
```
[lg:grid-cols-[3fr_2fr]]
  LEFT                   RIGHT
  [card skeleton]        [card skeleton]
  [card skeleton]        [card skeleton]
  [card skeleton]        [card skeleton]
[notes skeleton]
[button row skeleton]
```

### Reports Loading Skeleton
```
[card with table skeleton - 5 rows]
[card with table skeleton - 3 rows]
```

---

## Implementation Plan

### Step 1: Dashboard loading.tsx
**File**: `app/(dashboard)/loading.tsx`

Reuse existing skeletons:
```tsx
import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards-skeleton";
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 rounded-md bg-muted animate-pulse" /> {/* header */}
      <StatsCardsSkeleton />
      <DashboardChartsSkeleton />
    </div>
  );
}
```

### Step 2: Collections loading.tsx
**File**: `app/(dashboard)/collections/loading.tsx`

Skeleton matching the HistoryTable layout:
- Filter bar row (2 inputs + select)
- Table header row
- 5 data rows (each: date, location, coins, revenue, profit, actions)
- Pagination row

### Step 3: Collections New loading.tsx
**File**: `app/(dashboard)/collections/new/loading.tsx`

Skeleton matching the 2-column form from PRP-006:
- Page header
- `lg:grid-cols-[3fr_2fr]` grid
  - Left: 3 card skeletons
  - Right: 3 card skeletons
- Notes + button row at bottom

### Step 4: Reports loading.tsx
**File**: `app/(dashboard)/reports/loading.tsx`

- Page header
- 2 card skeletons each containing a 5-row table skeleton

### Step 5: Shared Error Boundary
**File**: `app/(dashboard)/error.tsx`

```tsx
"use client";
import { AlertTriangle } from "lucide-react";
// ...card with reset() + Link to /
```

---

## Files to Create

1. `app/(dashboard)/loading.tsx`
2. `app/(dashboard)/collections/loading.tsx`
3. `app/(dashboard)/collections/new/loading.tsx`
4. `app/(dashboard)/reports/loading.tsx`
5. `app/(dashboard)/error.tsx`

## Files to Modify
None.

---

## Acceptance Criteria

- [ ] Slow dashboard load shows stat card skeletons + chart skeletons (not blank screen)
- [ ] Slow collections page shows table skeleton
- [ ] Slow new collection page shows 2-column form skeleton
- [ ] Slow reports page shows two table-card skeletons
- [ ] Unhandled server error shows error card with "Try Again" + "Go to Dashboard"
- [ ] "Try Again" button re-runs the failed server component
- [ ] No TypeScript errors
- [ ] Build passes

---

## Testing Checklist

### Loading
- [ ] Add `await new Promise(r => setTimeout(r, 3000))` temporarily to a server fetch — confirm skeleton shows

### Error
- [ ] Add `throw new Error("test")` temporarily to a server component — confirm error boundary renders (not Next.js crash screen)
- [ ] Click "Try Again" — confirm it re-fetches and recovers

---

## Dependencies
- ✅ `components/dashboard/stats-cards-skeleton.tsx`
- ✅ `components/dashboard/dashboard-charts-skeleton.tsx`
- ✅ `components/ui/skeleton.tsx`
- ✅ `components/ui/card.tsx`
- lucide-react `AlertTriangle` (already installed)

---

## Estimated Time
**2 hours**

---

**Previous PRP**: PRP-009 (Navigation & Layout) ✅
**Next PRP**: PRP-011 (Responsive Design)
