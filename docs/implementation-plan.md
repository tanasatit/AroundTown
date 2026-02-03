# Implementation Plan

## Overview
This document outlines the complete implementation plan broken into discrete PRPs (Problem-Requirements-Plans). Each PRP is a focused, testable unit of work.

## Development Workflow

```
1. Read PRP
2. Review with Claude (lock decisions)
3. Implement code
4. Test & verify
5. Git commit
6. Move to next PRP
```

## Phase Breakdown

### ✅ Phase 0-3: Foundation (COMPLETED)
You've completed:
- [x] Environment setup
- [x] Project initialization
- [x] Database schema
- [x] Authentication system

Current state: Can login at `/login`

---

## 🎯 Phase 4: Core Collection System

### PRP-001: Collection API Endpoints
**Status**: Ready to implement  
**File**: `prp/001-collection-api.md`  
**Duration**: 2 hours  
**Dependencies**: None (auth is done)

**What**: Create REST API for collection CRUD operations
- POST /api/collections (create)
- GET /api/collections (list with pagination)
- GET /api/collections/[id] (single)
- PUT /api/collections/[id] (update)
- DELETE /api/collections/[id] (delete)

**Why**: Backend foundation for all collection features

**Deliverables**:
- API route handlers
- Zod validation schemas
- Error handling
- Calculation logic integration

---

### PRP-002: Collection Entry Form
**Status**: Blocked by PRP-001  
**File**: `prp/002-collection-form.md`  
**Duration**: 4 hours  
**Dependencies**: PRP-001

**What**: Create form to enter new collection data
- Machine coins input
- Exchange box inputs (all denominations)
- Real-time calculation display
- Machine location selector
- Validation & error messages

**Why**: Primary user interface for data entry

**Deliverables**:
- React form component
- Real-time calculations
- Input validation
- Success/error handling

---

### PRP-003: Dashboard Stats Cards
**Status**: Blocked by PRP-001  
**File**: `prp/003-dashboard-stats.md`  
**Duration**: 3 hours  
**Dependencies**: PRP-001

**What**: Dashboard homepage with key metrics
- Total revenue (this week)
- Postcards sold (this week)
- Profit (this week)
- Current inventory

**Why**: Quick overview of business performance

**Deliverables**:
- Dashboard page
- Stat card components (shadcn dark theme)
- API endpoint for stats
- Loading states

---

### PRP-004: Collections History Table
**Status**: Blocked by PRP-001  
**File**: `prp/004-history-table.md`  
**Duration**: 3 hours  
**Dependencies**: PRP-001

**What**: View all past collections in table
- Sortable columns
- Pagination
- Search/filter by date, location, week
- View details modal

**Why**: Access historical data

**Deliverables**:
- History page
- Data table component
- Filters
- Modal component

---

## 🎯 Phase 5: Refill Management

### PRP-005: Refill API Endpoints
**Status**: Blocked by Phase 4  
**File**: `prp/005-refill-api.md`  
**Duration**: 1.5 hours  
**Dependencies**: Phase 4 complete

**What**: REST API for refill operations
- POST /api/refills
- GET /api/refills
- GET /api/refills/[id]
- PUT /api/refills/[id]
- DELETE /api/refills/[id]

**Why**: Track postcard restocking

**Deliverables**:
- API route handlers
- Validation
- Error handling

---

### PRP-006: Refill Entry Form
**Status**: Blocked by PRP-005  
**File**: `prp/006-refill-form.md`  
**Duration**: 2 hours  
**Dependencies**: PRP-005

**What**: Form to record refill events
- Auto-fill current inventory
- Postcards added input
- Calculate new total
- Machine location selector

**Why**: Record when postcards are restocked

**Deliverables**:
- Refill form component
- Auto-calculations
- Success handling

---

## 🎯 Phase 6: Analytics & Reports

### PRP-007: Dashboard Charts
**Status**: Blocked by Phase 4  
**File**: `prp/007-dashboard-charts.md`  
**Duration**: 3 hours  
**Dependencies**: Phase 4 complete

**What**: Visual charts on dashboard
- Revenue trend (line chart)
- Sales by week (bar chart)
- Inventory level (area chart)

**Why**: Visualize business trends

**Deliverables**:
- Chart components (recharts + shadcn dark theme)
- Data aggregation logic
- Time period selector

---

### PRP-008: Reports Page
**Status**: Blocked by Phase 6  
**File**: `prp/008-reports-page.md`  
**Duration**: 4 hours  
**Dependencies**: PRP-007

**What**: Comprehensive reports interface
- Weekly summary
- Monthly summary
- Location comparison
- Export to Excel

**Why**: Business intelligence and record keeping

**Deliverables**:
- Reports page
- Summary tables
- Excel export (xlsx library)
- Print-friendly layout

---

## 🎯 Phase 7: Polish & UX

### PRP-009: Navigation & Layout
**Status**: Blocked by Phase 4  
**File**: `prp/009-navigation.md`  
**Duration**: 2 hours  
**Dependencies**: Phase 4 complete

**What**: Dashboard layout with navigation
- Sidebar navigation
- User menu
- Logout button
- Breadcrumbs
- Mobile responsive

**Why**: Easy navigation between features

**Deliverables**:
- Dashboard layout component
- Navigation sidebar
- Mobile menu
- User dropdown

---

### PRP-010: Loading & Error States
**Status**: Blocked by Phase 7  
**File**: `prp/010-loading-states.md`  
**Duration**: 2 hours  
**Dependencies**: Navigation done

**What**: Polish all loading and error UX
- Skeleton loaders
- Error boundaries
- Empty states
- Toast notifications

**Why**: Professional UX

**Deliverables**:
- Loading skeletons
- Error components
- Toast system
- Empty state messages

---

### PRP-011: Responsive Design
**Status**: Blocked by Phase 7  
**File**: `prp/011-responsive-design.md`  
**Duration**: 3 hours  
**Dependencies**: All features done

**What**: Ensure mobile/tablet compatibility
- Test on mobile (320px - 768px)
- Test on tablet (768px - 1024px)
- Touch-friendly inputs
- Responsive tables

**Why**: 3 users may use phones/tablets

**Deliverables**:
- Mobile-responsive components
- Touch improvements
- Tested on multiple devices

---

## 🎯 Phase 8: Testing & Deployment

### PRP-012: End-to-End Testing
**Status**: Final phase  
**File**: `prp/012-e2e-testing.md`  
**Duration**: 3 hours  
**Dependencies**: All features done

**What**: Manual testing of all workflows
- Login flow
- Create collection flow
- View history flow
- Create refill flow
- View reports flow
- Error scenarios

**Why**: Ensure everything works

**Deliverables**:
- Testing checklist
- Bug fixes
- Edge case handling

---

### PRP-013: Production Deployment
**Status**: Final phase  
**File**: `prp/013-deployment.md`  
**Duration**: 2 hours  
**Dependencies**: PRP-012

**What**: Deploy to production
- Set environment variables
- Configure Vercel
- Configure Supabase
- Test production build
- Set up custom domain (optional)

**Why**: Make it live

**Deliverables**:
- Live production URL
- Deployment documentation
- Environment variable setup
- Backup strategy

---

### PRP-014: User Training & Documentation
**Status**: Final phase  
**File**: `prp/014-user-training.md`  
**Duration**: 2 hours  
**Dependencies**: PRP-013

**What**: Train 3 team members
- User guide document
- Video walkthrough
- FAQ document
- Support contact

**Why**: Team needs to use the system

**Deliverables**:
- User manual (PDF)
- Training video
- FAQ doc
- Support plan

---

## Timeline Estimate

| Phase | PRPs | Duration | Status |
|-------|------|----------|--------|
| 0-3 | Setup | 6h | ✅ Done |
| 4 | Collection System | 12h | 🎯 Next |
| 5 | Refill System | 3.5h | ⏳ Waiting |
| 6 | Analytics | 7h | ⏳ Waiting |
| 7 | Polish | 7h | ⏳ Waiting |
| 8 | Testing & Deploy | 7h | ⏳ Waiting |
| **Total** | **14 PRPs** | **42.5h** | **14% done** |

## Current Priority: PRP-001

**Next Action**: Review `prp/001-collection-api.md`

**Command**: Ask Claude to review the PRP and lock decisions before implementation.

---

## PRP Status Legend
- ✅ Done - Completed and tested
- 🎯 Next - Ready to start
- ⏳ Waiting - Blocked by dependencies
- 🚧 In Progress - Currently working on
- ❌ Blocked - Cannot proceed (issue)

## Context Engineering Tips

### Before Starting Each PRP
1. Read the PRP document
2. Ask Claude: "Review PRP-XXX. What decisions must be made?"
3. Lock all decisions
4. Then say: "Implement PRP-XXX. Follow claude.md and locked decisions."

### During Implementation
- Test each piece as you build
- Commit after each working state
- Don't move to next PRP until current one passes acceptance criteria

### After Each PRP
- Update this file (mark as ✅ Done)
- Git commit with message: "Complete PRP-XXX: [description]"
- Take a break if needed
- Review next PRP

---

## Git Commit Convention

```
Complete PRP-001: Collection API endpoints

- POST /api/collections with validation
- GET /api/collections with pagination
- GET /api/collections/[id]
- PUT /api/collections/[id]
- DELETE /api/collections/[id]
- Integrated calculation logic
- Added error handling

Tested: All endpoints working
```

---

## Quick Reference

**Start Next PRP**:
1. Open `prp/001-collection-api.md`
2. Review with Claude
3. Implement
4. Test
5. Commit
6. Move to PRP-002

**Stuck?**: 
- Review `docs/` for business context
- Check `claude.md` for stack decisions
- Ask Claude for clarification

**Need Help?**:
- Provide current code state
- Reference the PRP you're working on
- Ask specific questions