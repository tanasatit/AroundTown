# PRP-002: Collection Entry Form

## Problem
Users need a form to enter collection data (coins counted from machine and exchange box). The form must calculate sales in real-time and submit to the API.

## Scope
- **In scope**: Collection entry form UI, real-time calculations, form validation
- **Out of scope**: History view, dashboard, reports

## Requirements

### Functional Requirements

#### FR-1: Collection Form Page
- Create page at `/collections/new`
- Protected route (requires login)
- Dark theme using shadcn/ui components

#### FR-2: Form Fields
Required inputs:
- Collection date (date picker, default today)
- Round number (select: 1 or 2)
- Week number (auto-calculated from date, editable)
- Machine location (select from predefined list)
- Machine coins (10-baht coins count)
- Exchange box counts (all 9 denominations)
- Postcards remaining (number input)
- Cost per postcard (default 13.766, editable)
- Notes (optional textarea)

#### FR-3: Real-time Calculations
Display as user types:
- Machine total (coins x 10)
- Postcards sold (coins / 4)
- Revenue (postcards x 40)
- Cost (postcards x cost per postcard)
- Profit (revenue - cost)
- Exchange box total
- Exchange balance status (balanced if = 12,000)

#### FR-4: Validation
- Machine coins must be divisible by 4
- All counts must be >= 0
- Date cannot be future
- Location is required
- Show inline error messages

#### FR-5: Submit & Feedback
- Submit button calls POST /api/collections
- Show loading state during submit
- On success: show toast, redirect to history or stay for another entry
- On error: show error message, keep form data

### Non-Functional Requirements

#### NFR-1: UX
- Tab-friendly (keyboard navigation)
- Auto-focus first field
- Large touch targets for mobile
- Clear visual feedback

#### NFR-2: Performance
- Debounce calculations (100ms)
- No unnecessary re-renders

## UI Design

### Layout
```
+------------------------------------------+
|  New Collection                    [Date]|
+------------------------------------------+
|                                          |
|  Machine Location: [Dropdown          v] |
|  Round: [1] [2]     Week: [Auto]         |
|                                          |
+------------------------------------------+
|  MACHINE                                 |
|  10-baht coins: [____]                   |
|                                          |
|  Total: ฿3,000  |  Postcards: 75        |
+------------------------------------------+
|  EXCHANGE BOX                            |
|  1฿ [__] 2฿ [__] 5฿ [__] 10฿ [__]       |
|  20฿[__] 50฿[__] 100฿[__]               |
|  500฿[__] 1000฿[__]                     |
|                                          |
|  Total: ฿12,000  [✓ Balanced]           |
+------------------------------------------+
|  SUMMARY                                 |
|  Revenue:  ฿3,000                        |
|  Cost:     ฿1,032.45                     |
|  Profit:   ฿1,967.55                     |
+------------------------------------------+
|  Postcards remaining: [____]             |
|  Notes: [_________________________]      |
|                                          |
|  [Cancel]              [Save Collection] |
+------------------------------------------+
```

### Machine Locations (predefined)
```typescript
const MACHINE_LOCATIONS = [
  "Rare Aroon - Ground Floor",
  "Central World - 3rd Floor",
  // Add more as needed
];
```

## Implementation Plan

### Step 1: Create Form Components
**Files**:
- `components/forms/collection-form.tsx` - Main form component
- `components/forms/exchange-inputs.tsx` - Exchange box input group
- `components/forms/calculation-display.tsx` - Real-time calculations

### Step 2: Create Page
**File**: `app/(dashboard)/collections/new/page.tsx`

### Step 3: Add Form Logic
- Use react-hook-form + zod resolver
- Use existing validation schema from `lib/validations/collection.ts`
- Add real-time calculation hook

### Step 4: Style with shadcn/ui
Components to use:
- Card, CardHeader, CardContent
- Input, Label
- Select, SelectTrigger, SelectContent, SelectItem
- Button
- Calendar (date picker)
- Textarea
- Badge (for balance status)

### Step 5: Connect to API
- Use fetch or TanStack Query mutation
- Handle loading/error states
- Add toast notifications

## Dependencies
- ✅ PRP-001 (Collection API) - COMPLETED
- shadcn/ui components (need to install: Card, Input, Select, Calendar, etc.)

## Files to Create

### New Files
1. `app/(dashboard)/layout.tsx` - Dashboard layout (if not exists)
2. `app/(dashboard)/collections/new/page.tsx` - Form page
3. `components/forms/collection-form.tsx` - Form component
4. `lib/constants.ts` - Machine locations list

### Modified Files
- May need to install additional shadcn/ui components

## Acceptance Criteria

- [ ] Form renders at `/collections/new`
- [ ] All required fields present
- [ ] Real-time calculations update as user types
- [ ] Machine coins validates divisible by 4
- [ ] Exchange balance indicator shows correct status
- [ ] Submit creates collection via API
- [ ] Success shows toast and option to add another
- [ ] Error shows message, preserves form data
- [ ] Form is keyboard navigable
- [ ] Dark theme styling matches design system
- [ ] Mobile responsive

## Testing Checklist

### Happy Path
- [ ] Fill form with valid data, submit
- [ ] Verify calculations match API response
- [ ] Add another collection after success

### Validation
- [ ] Submit with empty required fields
- [ ] Enter coins not divisible by 4
- [ ] Enter negative numbers
- [ ] Select future date

### Edge Cases
- [ ] Enter 0 coins (valid, no sales)
- [ ] Enter very large numbers
- [ ] Network error during submit
- [ ] Session expired during submit

## Notes

Before implementing, install required shadcn/ui components:
```bash
npx shadcn@latest add card input label select button calendar textarea badge
```

---

**Previous PRP**: PRP-001 (Collection API) ✅
**Next PRP**: PRP-003 (Dashboard Stats Cards)
