# PRP-009: Navigation & Layout

## Problem
The current dashboard layout has a minimal header with a temporary nav bar (added in PRP-008) and no active-state indicators, no logout button, no mobile menu, and no user dropdown. The nav needs to be polished into a proper, production-ready shell that works on all screen sizes.

## Current State
`app/(dashboard)/layout.tsx` already has:
- Brand name (`SeeYou AroundTown`) in header
- Inline nav links: `Dashboard | Collections | Reports` (hidden on mobile, no active state)
- User name/email displayed as plain text — no logout

## Scope
- **In scope**: Active nav link highlighting, logout button, mobile hamburger menu, user display polish
- **Out of scope**: Sidebar layout (top-nav is fine for this app size), breadcrumbs (not needed), role-based nav

---

## Requirements

### Functional Requirements

#### FR-1: Active Nav Link
- The current page's nav link is visually highlighted
- Use `usePathname()` in a client component to detect active route
- Active style: `text-foreground bg-muted` (vs idle: `text-muted-foreground hover:text-foreground hover:bg-muted`)
- Exact match for `/` (Dashboard); prefix match for `/collections` and `/reports`

#### FR-2: Logout Button
- Shown in the header right side, next to the user name
- Label: "Logout" with a `LogOut` icon
- Uses NextAuth `signOut()` — must be a client component action
- On click: calls `signOut({ callbackUrl: '/login' })`, redirects to `/login`
- Style: ghost/outline button, small size

#### FR-3: Mobile Menu
- On screens `< sm` (< 640px), the inline nav is hidden
- Replace with a hamburger icon button (`Menu` / `X` from lucide)
- On click: toggles a dropdown nav panel below the header
- Panel contains the same 3 links + closes on navigation
- No external libraries — use `useState` + conditional rendering

#### FR-4: User Display
- Show user name (or email if no name) — already done
- Keep as plain text, no dropdown needed (logout is a direct button)

### Non-Functional Requirements

#### NFR-1: Server/Client Split
- `layout.tsx` stays a **server component** — it calls `auth()` to get session
- Extract nav into a `<NavBar>` client component that receives `userName` as a prop
- `NavBar` handles: `usePathname`, mobile toggle state, logout action

#### NFR-2: No Flicker
- Active state is derived from `usePathname()` on the client — no SSR mismatch issues since NavBar is `"use client"`

#### NFR-3: Accessibility
- Hamburger button has `aria-label="Toggle menu"`
- Mobile menu panel has `role="navigation"`

---

## UI Design

### Desktop Header (≥ 640px)
```
+------------------------------------------------------------------+
|  SeeYou AroundTown   [Dashboard] [Collections] [Reports]        |
|                                          [User Name]  [Logout]  |
+------------------------------------------------------------------+
```

### Mobile Header (< 640px)
```
+----------------------------------+
|  SeeYou AroundTown          [☰] |
+----------------------------------+
```

### Mobile Menu (open)
```
+----------------------------------+
|  SeeYou AroundTown          [✕] |
+----------------------------------+
|  Dashboard                       |
|  Collections                     |
|  Reports                         |
|  ─────────────────────────────   |
|  User Name              Logout   |
+----------------------------------+
```

### Active Link Style
- Idle: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Active: `text-foreground bg-muted`
- Both: `px-3 py-1.5 rounded-md text-sm transition-colors`

---

## Implementation Plan

### Step 1: NavBar Client Component
**File**: `components/layout/nav-bar.tsx` (new file)

```tsx
"use client";
// Props: userName: string
// State: mobileOpen (boolean)
// usePathname() for active detection
// signOut() for logout
// Renders: desktop nav + mobile hamburger + mobile panel
```

Active link helper:
```tsx
function navLinkClass(pathname: string, href: string) {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return cn(
    "px-3 py-1.5 rounded-md text-sm transition-colors",
    isActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"
  );
}
```

### Step 2: Update Layout
**File**: `app/(dashboard)/layout.tsx`

- Replace inline nav + user display with `<NavBar userName={session.user.name ?? session.user.email ?? ""} />`
- Header becomes just brand name + NavBar

### Step 3: Logout Action
Inside `NavBar`:
```tsx
import { signOut } from "next-auth/react";
// ...
<Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
  <LogOut className="mr-1 h-4 w-4" />
  Logout
</Button>
```

---

## Files to Create

1. `components/layout/nav-bar.tsx` — client NavBar component

## Files to Modify

1. `app/(dashboard)/layout.tsx` — replace inline nav with `<NavBar>`

---

## Acceptance Criteria

- [ ] Active nav link is highlighted on Desktop for `/`, `/collections`, `/reports`
- [ ] Inactive links are muted; active link uses `bg-muted text-foreground`
- [ ] Logout button visible in header (desktop)
- [ ] Clicking Logout → redirects to `/login`, session cleared
- [ ] On mobile (< 640px): hamburger icon shown, inline nav hidden
- [ ] Tapping hamburger: mobile menu opens with all 3 links + logout
- [ ] Tapping a nav link in mobile menu: menu closes, navigates correctly
- [ ] User name displayed in header / mobile menu
- [ ] No TypeScript errors
- [ ] Build passes

---

## Testing Checklist

### Desktop
- [ ] Navigate to `/` → Dashboard link highlighted
- [ ] Navigate to `/collections` → Collections link highlighted
- [ ] Navigate to `/reports` → Reports link highlighted
- [ ] Click Logout → redirected to `/login`

### Mobile (resize to < 640px)
- [ ] Hamburger shown, nav links hidden
- [ ] Tap hamburger → menu opens
- [ ] Tap a link → navigates + menu closes
- [ ] Tap hamburger again → menu closes
- [ ] Logout in mobile menu works

---

## Questions to Lock Before Implementation

1. **Layout style**: Top-nav header (not sidebar) — confirmed for this app size
2. **Logout**: Client-side `signOut()` from `next-auth/react`, redirect to `/login`
3. **Mobile menu**: Simple `useState` toggle, no animation library
4. **User display**: Name or email as plain text, no dropdown
5. **NavBar split**: Server layout passes `userName` string to client NavBar — no session data in client component

---

## Dependencies
- ✅ `app/(dashboard)/layout.tsx` — exists, has minimal nav from PRP-008
- ✅ `lib/auth.ts` — NextAuth with `signOut` export
- `next-auth/react` — `signOut` client function (already available via next-auth)
- lucide-react — `LogOut`, `Menu`, `X` icons (already installed)
- shadcn `Button` — already installed

---

## Estimated Time
**2 hours**

---

**Previous PRP**: PRP-008 (Reports Page) ✅
**Next PRP**: PRP-010 (Loading & Error States)
