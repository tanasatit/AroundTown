# PRP-015: Machine Management

## Problem
Machine locations are hardcoded in `lib/constants.ts` as a static array. Adding or renaming a machine requires a code change + redeploy. Machines also have no metadata (no image, no postcard set label, no active/inactive state). As the business grows, non-technical team members need to manage machines without touching code.

## Current State
- `MACHINE_LOCATIONS` in `lib/constants.ts` — 2 hardcoded strings:
  - `"Rare Aroon - Ground Floor"`
  - `"Central World - 3rd Floor"`
- All forms (`collection-form.tsx`, `edit-collection-modal.tsx`) use this constant for the location `<Select>`
- History table filter uses it too
- No `Machine` model in Prisma schema

## Scope
- **In scope**: Machine model, CRUD API, settings page UI, wire collection form to DB
- **Out of scope**: Machine images/photos, per-machine postcard set tracking, multi-user permission levels (admin vs regular)

---

## Requirements

### FR-1: Prisma `Machine` Model
Add to `prisma/schema.prisma`:

```prisma
model Machine {
  id          Int          @id @default(autoincrement())
  name        String       @unique        // e.g. "Rare Aroon - Ground Floor"
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  collections Collection[]
  refills     Refill[]
}
```

`Collection` and `Refill` keep `machineLocation String` — **no FK migration needed**. The machine name stored in existing records stays as-is. New collections select from live DB names.

### FR-2: Seed Initial Machines
On first deploy, seed the two existing machines so the form still works:
- `"Rare Aroon - Ground Floor"` (isActive: true)
- `"Central World - 3rd Floor"` (isActive: true)

Seeding via `prisma/seed.ts` (upsert — safe to re-run).

### FR-3: `/api/machines` Endpoints

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/machines` | List all (active only by default, `?all=true` for admin) |
| POST | `/api/machines` | Create new machine |
| PUT | `/api/machines/[id]` | Update name or isActive |
| DELETE | `/api/machines/[id]` | Soft-delete (set isActive=false) — no hard delete |

All routes require auth session.

Request body for POST/PUT:
```json
{ "name": "Terminal 21 - 2nd Floor", "isActive": true }
```

Validation: name required, 3–200 chars, unique.

### FR-4: `/settings/machines` Admin Page
Route: `app/(dashboard)/settings/machines/page.tsx`

Layout:
```
Settings > Machines

[+ Add Machine]  button top-right

Table:
  Name | Status | Actions
  ─────────────────────────────
  Rare Aroon - GF  | ● Active  | [Edit] [Deactivate]
  Central World 3F | ● Active  | [Edit] [Deactivate]
  Old Location     | ○ Inactive| [Edit] [Activate]

[Inline add/edit row — no separate page needed]
```

Behaviors:
- **Add**: Show inline input row at top of table, save on Enter or "Add" button
- **Edit**: Inline — click Edit → name becomes input, save/cancel buttons appear
- **Deactivate**: Sets `isActive = false`, machine disappears from collection form dropdown
- **Activate**: Sets `isActive = true`, machine reappears in dropdown
- **No hard delete**: Prevents breaking historical collection records that reference the name

### FR-5: Collection Form Pulls from DB
Replace `MACHINE_LOCATIONS` constant with a server fetch in:
- `app/(dashboard)/collections/new/page.tsx` — fetch active machines, pass as prop to `CollectionForm`
- `CollectionForm` receives `machines: string[]` prop instead of reading the constant
- `edit-collection-modal.tsx` — same prop approach (fetch in `history-table.tsx` parent or pass down)
- History table location filter — also switch from constant to fetched list

---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | No FK from Collection → Machine | Zero migration risk on existing data; name string is the join key |
| D2 | Soft-delete only | Historical collections reference machine name; hard delete would orphan records |
| D3 | Fetch machines server-side on page load | No client-side fetch needed; simpler, no loading state for the dropdown |
| D4 | Inline edit on settings page | Faster UX, no separate route, fewer components |
| D5 | `name` is unique in DB | Prevents duplicate machine entries; validation error shown inline |

---

## Files to Create / Modify

### New Files
```
prisma/seed.ts                              — seed initial machines
app/api/machines/route.ts                   — GET (list), POST (create)
app/api/machines/[id]/route.ts              — PUT (update), DELETE (deactivate)
app/(dashboard)/settings/machines/page.tsx  — admin UI
components/settings/machines-table.tsx      — client component for inline CRUD
```

### Modified Files
```
prisma/schema.prisma                        — add Machine model
package.json                               — add "prisma": { "seed": "..." }
lib/constants.ts                            — remove MACHINE_LOCATIONS export (or keep as fallback)
components/forms/collection-form.tsx        — accept machines prop, remove constant
components/collections/edit-collection-modal.tsx — accept machines prop
components/collections/history-table.tsx    — accept machines prop for filter
app/(dashboard)/collections/new/page.tsx    — fetch + pass machines
app/(dashboard)/collections/page.tsx        — fetch + pass machines
```

---

## Acceptance Criteria

1. `/settings/machines` shows all machines with status badges
2. Can add a new machine — it immediately appears in the collection form dropdown
3. Can rename a machine — new name appears in dropdown
4. Deactivating a machine removes it from the dropdown (existing historical records unaffected)
5. Activating a machine brings it back to the dropdown
6. Collection form `<Select>` is populated from DB, not from `lib/constants.ts`
7. History table location filter also uses DB machine list
8. No TypeScript errors (`npx tsc --noEmit` clean)
9. Seed runs cleanly: `npx prisma db seed` is idempotent

---

## Implementation Order

1. Schema: add `Machine` model → `npx prisma db push`
2. Seed: create `prisma/seed.ts`, run it → verify 2 machines in DB
3. API: `/api/machines` GET + POST, then `/api/machines/[id]` PUT + DELETE
4. Settings UI: `machines-table.tsx` + page
5. Wire forms: update `collection-form.tsx`, `edit-collection-modal.tsx`, history filter
6. Remove (or deprecate) `MACHINE_LOCATIONS` from `lib/constants.ts`
7. Type check + smoke test
