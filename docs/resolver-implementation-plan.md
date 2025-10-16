# Resolver Implementation Plan

## Executive Summary

This document provides a comprehensive analysis of the VGN (Veteran Garage Network) frontend codebase and outlines the custom resolvers needed to implement secure, approval-based authorization. The plan addresses the security vulnerability where unapproved content is currently visible to guest users.

**Last Updated**: October 16, 2025  
**Total VTL Resolvers Required**: 20

---

## Quick Reference: Complete Resolver List

> **Note**: This is the definitive list of all VTL resolvers to be implemented. Feel free to add comments or notes as needed during implementation.

### Club Resolvers (5 total)

| # | Resolver Name | Access Level | Optional Parameters | Purpose | Status | Notes |
|---|--------------|--------------|---------------------|---------|--------|-------|
| 1 | `listPublicClubs` | Guest + Auth | None | List approved clubs | ⬜ Pending | |
| 2 | `getPublicClub` | Guest + Auth | `id` (required) | Get single approved club | ⬜ Pending | |
| 3 | `listMyClubs` | Authenticated | `approved` | List user's clubs (all) | ⬜ Pending | |
| 4 | `listUnapprovedClubs` | Admin | None | List unapproved clubs | ⬜ Pending | |
| 5 | `listAllClubs` | Admin | `approved` | List all clubs | ⬜ Pending | |

### Chapter Resolvers (5 total)

| # | Resolver Name | Access Level | Optional Parameters | Purpose | Status | Notes |
|---|--------------|--------------|---------------------|---------|--------|-------|
| 6 | `listPublicChapters` | Guest + Auth | `minLat`, `maxLat`, `minLng`, `maxLng`, `clubIds[]` | List approved chapters | ⬜ Pending | Geographic filtering |
| 7 | `getPublicChapter` | Guest + Auth | `id` (required) | Get single approved chapter | ⬜ Pending | |
| 8 | `listMyChapters` | Authenticated | `approved`, `minLat`, `maxLat`, `minLng`, `maxLng` | List user's chapters (all) | ⬜ Pending | Geographic filtering |
| 9 | `listUnapprovedChapters` | Admin | `minLat`, `maxLat`, `minLng`, `maxLng` | List unapproved chapters | ⬜ Pending | Geographic filtering |
| 10 | `listAllChapters` | Admin | `approved`, `minLat`, `maxLat`, `minLng`, `maxLng` | List all chapters | ⬜ Pending | Geographic filtering |

### Shop Resolvers (5 total)

| # | Resolver Name | Access Level | Optional Parameters | Purpose | Status | Notes |
|---|--------------|--------------|---------------------|---------|--------|-------|
| 11 | `listPublicShops` | Guest + Auth | `minLat`, `maxLat`, `minLng`, `maxLng` | List approved shops | ⬜ Pending | Geographic filtering |
| 12 | `getPublicShop` | Guest + Auth | `id` (required) | Get single approved shop | ⬜ Pending | |
| 13 | `listMyShops` | Authenticated | `approved`, `minLat`, `maxLat`, `minLng`, `maxLng` | List user's shops (all) | ⬜ Pending | Geographic filtering |
| 14 | `listUnapprovedShops` | Admin | `minLat`, `maxLat`, `minLng`, `maxLng` | List unapproved shops | ⬜ Pending | Geographic filtering |
| 15 | `listAllShops` | Admin | `approved`, `minLat`, `maxLat`, `minLng`, `maxLng` | List all shops | ⬜ Pending | Geographic filtering |

### Event Resolvers (5 total)

| # | Resolver Name | Access Level | Optional Parameters | Purpose | Status | Notes |
|---|--------------|--------------|---------------------|---------|--------|-------|
| 16 | `listPublicEvents` | Guest + Auth | `minLat`, `maxLat`, `minLng`, `maxLng` | List approved events | ⬜ Pending | Geographic filtering |
| 17 | `getPublicEvent` | Guest + Auth | `id` (required) | Get single approved event | ⬜ Pending | |
| 18 | `listMyEvents` | Authenticated | `approved`, `minLat`, `maxLat`, `minLng`, `maxLng` | List user's events (all) | ⬜ Pending | Geographic filtering |
| 19 | `listUnapprovedEvents` | Admin | `minLat`, `maxLat`, `minLng`, `maxLng` | List unapproved events | ⬜ Pending | Geographic filtering |
| 20 | `listAllEvents` | Admin | `approved`, `minLat`, `maxLat`, `minLng`, `maxLng` | List all events | ⬜ Pending | Geographic filtering |

### Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Resolvers** | 20 |
| **Public Access (Guest + Auth)** | 8 |
| **Authenticated Only** | 4 |
| **Admin Only** | 8 |
| **With Geographic Filtering** | 12 |
| **Without Geographic Filtering** | 8 |

---

## Table of Contents

1. [Current Security Issues](#current-security-issues)
2. [Frontend Query Analysis](#frontend-query-analysis)
3. [Required Resolvers](#required-resolvers)
4. [Schema Changes](#schema-changes)
5. [Frontend Refactoring](#frontend-refactoring)
6. [Implementation Phases](#implementation-phases)
7. [Testing Strategy](#testing-strategy)
8. [Migration Guide](#migration-guide)

---

## Current Security Issues

### Critical Vulnerabilities

1. **Unapproved Data Exposure**
   - Guest users can access unapproved clubs, chapters, shops, and events
   - Model-level authorization allows `allow.guest().to(['read'])`
   - No filtering by `approved` field at the authorization layer

2. **Direct API Access**
   - Users can bypass frontend filters by directly querying models
   - Example: `client.models.Club.list()` returns all clubs including unapproved

3. **Association Approval**
   - Club/Chapter associations default to `approved: true`
   - No mechanism for club/chapter owners to approve associations

### Current Authorization Pattern

```typescript
// Current (INSECURE)
Club: a.model({...})
  .authorization((allow) => [
    allow.guest().to(['read']),  // ⚠️ Allows reading unapproved data
    allow.authenticated().to(['read', 'create']),
    allow.ownersDefinedIn('owners').to(['read', 'update', 'delete']),
    allow.groups(['admin']).to(['read', 'update', 'delete']),
  ])
```

---

## Frontend Query Analysis

### Pages Analyzed

1. **Clubs.tsx** - Club and chapter browsing
2. **Events.tsx** - Event calendar and browsing
3. **Shops.tsx** - Shop directory
4. **Approvals.tsx** - Admin approval interface
5. **Home.tsx** - Landing page (assumed to show public data)

### Modal Components Analyzed

**All modal components reviewed - NO READ QUERIES FOUND:**
- **CreateClubModal.tsx** - Only creates clubs (no queries)
- **RegisterChapterModal.tsx** - Only creates chapters and roles (no queries)
- **CreateShopModal.tsx** - Only creates shops and associations (no queries)
- **ClubModal.tsx** - Display only (receives data from parent)
- **ChapterModal.tsx** - Display only (receives data from parent)
- **ShopModal.tsx** - Display only (receives data from parent)
- **EventModal.tsx** - Display only (receives data from parent)
- **DayEventsModal.tsx** - Display only (receives data from parent)

**Finding**: Modal components do not perform independent database queries. They either:
1. Create new records (which are subject to approval workflow)
2. Display data passed from parent components (which already use filtered queries)

**Impact**: No changes needed to modal components for this security enhancement.

### Query Patterns Identified

#### 1. Clubs.tsx

**Current Queries:**
```typescript
// Fetch all clubs (for filter sidebar)
client.models.Club.list({
  filter: { approved: { eq: true } },
  authMode: 'identityPool' // or 'userPool'
})

// Fetch chapters (for map display)
client.models.ClubChapter.list({
  filter: { 
    and: [
      { approved: { eq: true } },
      { clubId: { eq: selectedClubId } },
      // Geographic bounds filters
    ]
  },
  authMode: 'identityPool' // or 'userPool'
})
```

**Security Issue**: Frontend filtering only - malicious users can bypass

**Required Resolvers**:
- `listPublicClubs` - Public approved clubs
- `listPublicChapters` - Public approved chapters
- `listPublicChaptersInBounds` - Geographic filtering
- `getPublicClub` - Single club by ID
- `getPublicChapter` - Single chapter by ID

#### 2. Events.tsx

**Current Queries:**
```typescript
// Fetch approved events (public)
client.models.Event.list({
  filter: { approved: { eq: true } },
  authMode: 'identityPool'
})

// Fetch user's unapproved events (authenticated)
client.models.Event.list({
  filter: { 
    and: [
      { approved: { eq: false } },
      { owners: { contains: user.userId } }
    ]
  },
  authMode: 'userPool'
})
```

**Security Issue**: Two separate queries, complex logic

**Required Resolvers**:
- `listPublicEvents` - Public approved events
- `listMyEvents` - User's events (approved + unapproved)
- `getPublicEvent` - Single event by ID

#### 3. Shops.tsx

**Current Queries:**
```typescript
// Fetch shops with geographic bounds
client.models.Shop.list({
  filter: {
    and: [
      { approved: { eq: true } },
      { latitude: { between: [minLat, maxLat] } },
      { longitude: { between: [minLng, maxLng] } }
    ]
  },
  authMode: 'identityPool'
})
```

**Security Issue**: Frontend filtering only

**Required Resolvers**:
- `listPublicShops` - Public approved shops
- `listPublicShopsInBounds` - Geographic filtering
- `getPublicShop` - Single shop by ID

#### 4. Approvals.tsx

**Current Queries:**
```typescript
// Admin: Fetch unapproved items
client.models.Club.list({
  filter: { approved: { eq: false } },
  authMode: 'userPool'
})

client.models.ClubChapter.list({
  filter: { approved: { eq: false } },
  authMode: 'userPool'
})

client.models.Shop.list({
  filter: { approved: { eq: false } },
  authMode: 'userPool'
})

client.models.Event.list({
  filter: { approved: { eq: false } },
  authMode: 'userPool'
})
```

**Security Issue**: Relies on route protection, not API-level authorization

**Required Resolvers**:
- `listUnapprovedClubs` - Admin only
- `listUnapprovedChapters` - Admin only
- `listUnapprovedShops` - Admin only
- `listUnapprovedEvents` - Admin only
- `listAllClubs` - Admin only (all clubs)
- `listAllChapters` - Admin only (all chapters)
- `listAllShops` - Admin only (all shops)
- `listAllEvents` - Admin only (all events)

---

## Required Resolvers

### Resolver Categories

1. **Public Resolvers** - Guest + Authenticated access
2. **User Resolvers** - Authenticated users only
3. **Admin Resolvers** - Admin group only

### Complete Resolver List

#### Club Resolvers

| Resolver Name | Access Level | Purpose | Implementation |
|--------------|--------------|---------|----------------|
| `listPublicClubs` | Guest + Auth | List approved clubs | VTL |
| `getPublicClub` | Guest + Auth | Get single approved club | VTL |
| `listMyClubs` | Authenticated | List user's clubs (all) | VTL |
| `listUnapprovedClubs` | Admin | List unapproved clubs | VTL |
| `listAllClubs` | Admin | List all clubs | VTL |

#### Chapter Resolvers

| Resolver Name | Access Level | Purpose | Implementation |
|--------------|--------------|---------|----------------|
| `listPublicChapters` | Guest + Auth | List approved chapters | VTL |
| `listPublicChaptersInBounds` | Guest + Auth | Geographic filtering | VTL |
| `getPublicChapter` | Guest + Auth | Get single approved chapter | VTL |
| `listMyChapters` | Authenticated | List user's chapters (all) | VTL |
| `listUnapprovedChapters` | Admin | List unapproved chapters | VTL |
| `listAllChapters` | Admin | List all chapters | VTL |

#### Shop Resolvers

| Resolver Name | Access Level | Purpose | Implementation |
|--------------|--------------|---------|----------------|
| `listPublicShops` | Guest + Auth | List approved shops | VTL |
| `listPublicShopsInBounds` | Guest + Auth | Geographic filtering | VTL |
| `getPublicShop` | Guest + Auth | Get single approved shop | VTL |
| `listMyShops` | Authenticated | List user's shops (all) | VTL |
| `listUnapprovedShops` | Admin | List unapproved shops | VTL |
| `listAllShops` | Admin | List all shops | VTL |

#### Event Resolvers

| Resolver Name | Access Level | Purpose | Implementation |
|--------------|--------------|---------|----------------|
| `listPublicEvents` | Guest + Auth | List approved events | VTL |
| `getPublicEvent` | Guest + Auth | Get single approved event | VTL |
| `listMyEvents` | Authenticated | List user's events (all) | VTL |
| `listUnapprovedEvents` | Admin | List unapproved events | VTL |
| `listAllEvents` | Admin | List all events | VTL |

#### Association Resolvers (Future Enhancement)

| Resolver Name | Access Level | Purpose | Implementation |
|--------------|--------------|---------|----------------|
| `listPublicClubAssociations` | Guest + Auth | Approved associations | VTL |
| `listPublicChapterAssociations` | Guest + Auth | Approved associations | VTL |
| `listPublicEventAssociations` | Guest + Auth | Approved associations | VTL |

---

## Schema Changes

### Step 1: Restrict Model-Level Authorization

**Before:**
```typescript
Club: a.model({...})
  .authorization((allow) => [
    allow.guest().to(['read']),  // ⚠️ REMOVE
    allow.authenticated().to(['read', 'create']),
    allow.ownersDefinedIn('owners').to(['read', 'update', 'delete']),
    allow.groups(['admin']).to(['read', 'update', 'delete']),
  ])
```

**After:**
```typescript
Club: a.model({...})
  .authorization((allow) => [
    // Remove guest read access
    allow.authenticated().to(['read', 'create']),
    allow.ownersDefinedIn('owners').to(['read', 'update', 'delete']),
    allow.groups(['admin']).to(['read', 'update', 'delete']),
  ])
```

### Step 2: Add Custom Queries

```typescript
const schema = a.schema({
  // ============================================================================
  // MODELS (Restricted Access)
  // ============================================================================
  
  Club: a.model({...}).authorization(...),
  ClubChapter: a.model({...}).authorization(...),
  Shop: a.model({...}).authorization(...),
  Event: a.model({...}).authorization(...),

  // ============================================================================
  // PUBLIC QUERIES
  // ============================================================================
  
  // Clubs
  listPublicClubs: a
    .query()
    .returns(a.ref('Club').array())
    .handler(a.handler.custom({
      dataSource: 'ClubTable',
      entry: './resolvers/listPublicClubs.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  getPublicClub: a
    .query()
    .arguments({ id: a.id().required() })
    .returns(a.ref('Club'))
    .handler(a.handler.custom({
      dataSource: 'ClubTable',
      entry: './resolvers/getPublicClub.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  // Chapters
  listPublicChapters: a
    .query()
    .returns(a.ref('ClubChapter').array())
    .handler(a.handler.custom({
      dataSource: 'ClubChapterTable',
      entry: './resolvers/listPublicChapters.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  listPublicChaptersInBounds: a
    .query()
    .arguments({
      minLat: a.float().required(),
      maxLat: a.float().required(),
      minLng: a.float().required(),
      maxLng: a.float().required(),
      clubIds: a.id().array()
    })
    .returns(a.ref('ClubChapter').array())
    .handler(a.handler.custom({
      dataSource: 'ClubChapterTable',
      entry: './resolvers/listPublicChaptersInBounds.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  getPublicChapter: a
    .query()
    .arguments({ id: a.id().required() })
    .returns(a.ref('ClubChapter'))
    .handler(a.handler.custom({
      dataSource: 'ClubChapterTable',
      entry: './resolvers/getPublicChapter.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  // Shops
  listPublicShops: a
    .query()
    .returns(a.ref('Shop').array())
    .handler(a.handler.custom({
      dataSource: 'ShopTable',
      entry: './resolvers/listPublicShops.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  listPublicShopsInBounds: a
    .query()
    .arguments({
      minLat: a.float().required(),
      maxLat: a.float().required(),
      minLng: a.float().required(),
      maxLng: a.float().required()
    })
    .returns(a.ref('Shop').array())
    .handler(a.handler.custom({
      dataSource: 'ShopTable',
      entry: './resolvers/listPublicShopsInBounds.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  getPublicShop: a
    .query()
    .arguments({ id: a.id().required() })
    .returns(a.ref('Shop'))
    .handler(a.handler.custom({
      dataSource: 'ShopTable',
      entry: './resolvers/getPublicShop.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  // Events
  listPublicEvents: a
    .query()
    .returns(a.ref('Event').array())
    .handler(a.handler.custom({
      dataSource: 'EventTable',
      entry: './resolvers/listPublicEvents.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  getPublicEvent: a
    .query()
    .arguments({ id: a.id().required() })
    .returns(a.ref('Event'))
    .handler(a.handler.custom({
      dataSource: 'EventTable',
      entry: './resolvers/getPublicEvent.js'
    }))
    .authorization((allow) => [allow.guest(), allow.authenticated()]),

  // ============================================================================
  // USER QUERIES (Authenticated Only)
  // ============================================================================
  
  listMyClubs: a
    .query()
    .arguments({
      approved: a.boolean().optional()
    })
    .returns(a.ref('Club').array())
    .handler(a.handler.custom({
      dataSource: 'ClubTable',
      entry: './resolvers/listMyClubs.js'
    }))
    .authorization((allow) => [allow.authenticated()]),

  listMyChapters: a
    .query()
    .arguments({
      approved: a.boolean().optional(),
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('ClubChapter').array())
    .handler(a.handler.custom({
      dataSource: 'ClubChapterTable',
      entry: './resolvers/listMyChapters.js'
    }))
    .authorization((allow) => [allow.authenticated()]),

  listMyShops: a
    .query()
    .arguments({
      approved: a.boolean().optional(),
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('Shop').array())
    .handler(a.handler.custom({
      dataSource: 'ShopTable',
      entry: './resolvers/listMyShops.js'
    }))
    .authorization((allow) => [allow.authenticated()]),

  listMyEvents: a
    .query()
    .arguments({
      approved: a.boolean().optional(),
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('Event').array())
    .handler(a.handler.custom({
      dataSource: 'EventTable',
      entry: './resolvers/listMyEvents.js'
    }))
    .authorization((allow) => [allow.authenticated()]),

  // ============================================================================
  // ADMIN QUERIES
  // ============================================================================
  
  // Unapproved items
  listUnapprovedClubs: a
    .query()
    .returns(a.ref('Club').array())
    .handler(a.handler.custom({
      dataSource: 'ClubTable',
      entry: './resolvers/listUnapprovedClubs.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  listUnapprovedChapters: a
    .query()
    .arguments({
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('ClubChapter').array())
    .handler(a.handler.custom({
      dataSource: 'ClubChapterTable',
      entry: './resolvers/listUnapprovedChapters.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  listUnapprovedShops: a
    .query()
    .arguments({
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('Shop').array())
    .handler(a.handler.custom({
      dataSource: 'ShopTable',
      entry: './resolvers/listUnapprovedShops.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  listUnapprovedEvents: a
    .query()
    .arguments({
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('Event').array())
    .handler(a.handler.custom({
      dataSource: 'EventTable',
      entry: './resolvers/listUnapprovedEvents.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  // All items (for admin dashboard)
  listAllClubs: a
    .query()
    .arguments({
      approved: a.boolean().optional()
    })
    .returns(a.ref('Club').array())
    .handler(a.handler.custom({
      dataSource: 'ClubTable',
      entry: './resolvers/listAllClubs.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  listAllChapters: a
    .query()
    .arguments({
      approved: a.boolean().optional(),
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('ClubChapter').array())
    .handler(a.handler.custom({
      dataSource: 'ClubChapterTable',
      entry: './resolvers/listAllChapters.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  listAllShops: a
    .query()
    .arguments({
      approved: a.boolean().optional(),
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('Shop').array())
    .handler(a.handler.custom({
      dataSource: 'ShopTable',
      entry: './resolvers/listAllShops.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),

  listAllEvents: a
    .query()
    .arguments({
      approved: a.boolean().optional(),
      minLat: a.float().optional(),
      maxLat: a.float().optional(),
      minLng: a.float().optional(),
      maxLng: a.float().optional()
    })
    .returns(a.ref('Event').array())
    .handler(a.handler.custom({
      dataSource: 'EventTable',
      entry: './resolvers/listAllEvents.js'
    }))
    .authorization((allow) => [allow.groups(['admin'])]),
});
```

---

## Frontend Refactoring

### File-by-File Changes

#### 1. Clubs.tsx

**Current Code:**
```typescript
const { data: clubsData } = await client.models.Club.list({
  filter: { approved: { eq: true } },
  authMode: 'identityPool'
});
```

**Refactored Code:**
```typescript
// Use custom query instead
const { data: clubsData } = await client.queries.listPublicClubs();
```

**Changes Required:**
- Replace `client.models.Club.list()` with `client.queries.listPublicClubs()`
- Replace `client.models.ClubChapter.list()` with `client.queries.listPublicChaptersInBounds()`
- Remove manual `filter: { approved: { eq: true } }` - handled by resolver

**Lines to Change**: ~70, ~150, ~250

#### 2. Events.tsx

**Current Code:**
```typescript
// Approved events
const { data: approvedEvents } = await client.models.Event.list({
  filter: { approved: { eq: true } },
  authMode: 'identityPool'
});

// User's unapproved events
const { data: userEvents } = await client.models.Event.list({
  filter: { 
    and: [
      { approved: { eq: false } },
      { owners: { contains: user.userId } }
    ]
  },
  authMode: 'userPool'
});
```

**Refactored Code:**
```typescript
// Single query returns both approved + user's unapproved
const { data: events } = authStatus === 'authenticated'
  ? await client.queries.listMyEvents()
  : await client.queries.listPublicEvents();
```

**Changes Required:**
- Simplify to single query based on auth status
- Remove complex filtering logic
- Remove manual merging of approved + unapproved events

**Lines to Change**: ~80-120

#### 3. Shops.tsx

**Current Code:**
```typescript
const { data: shopsData } = await client.models.Shop.list({
  filter: {
    and: [
      { approved: { eq: true } },
      { latitude: { between: [minLat, maxLat] } },
      { longitude: { between: [minLng, maxLng] } }
    ]
  },
  authMode: 'identityPool'
});
```

**Refactored Code:**
```typescript
const { data: shopsData } = await client.queries.listPublicShopsInBounds({
  minLat: mapBounds.southWest.lat,
  maxLat: mapBounds.northEast.lat,
  minLng: mapBounds.southWest.lng,
  maxLng: mapBounds.northEast.lng
});
```

**Changes Required:**
- Replace with custom query
- Pass bounds as arguments
- Remove manual filtering

**Lines to Change**: ~90, ~180

#### 4. Approvals.tsx

**Current Code:**
```typescript
const { data } = await client.models.Club.list({
  filter: { approved: { eq: false } },
  authMode: 'userPool'
});
```

**Refactored Code:**
```typescript
const { data } = await client.queries.listUnapprovedClubs();
```

**Changes Required:**
- Replace all `client.models.*.list()` with appropriate admin queries
- Remove manual filtering
- Queries will enforce admin-only access

**Lines to Change**: ~60, ~90, ~120, ~150

---

## Implementation Phases

### Phase 1: Create Resolver Files (Week 1)

**Tasks:**
1. Create `amplify/data/resolvers/` directory
2. Implement all VTL resolver files (see resolver list above)
3. Test each resolver individually in AppSync console

**Deliverables:**
- 30+ resolver files
- Unit tests for each resolver
- Documentation for each resolver

### Phase 2: Update Schema (Week 1)

**Tasks:**
1. Add all custom queries to `amplify/data/resource.ts`
2. Update model authorization rules (remove guest read)
3. Deploy schema changes to dev environment
4. Verify queries work in AppSync console

**Deliverables:**
- Updated schema file
- Deployment scripts
- Verification tests

### Phase 3: Frontend Refactoring (Week 2)

**Tasks:**
1. Update Clubs.tsx
2. Update Events.tsx
3. Update Shops.tsx
4. Update Approvals.tsx
5. Update any other pages using direct model queries

**Deliverables:**
- Refactored frontend code
- Updated TypeScript types
- Integration tests

### Phase 4: Testing & Validation (Week 2)

**Tasks:**
1. Test as guest user
2. Test as authenticated user
3. Test as admin user
4. Test as resource owner
5. Security penetration testing

**Deliverables:**
- Test results
- Security audit report
- Bug fixes

### Phase 5: Deployment (Week 3)

**Tasks:**
1. Deploy to staging environment
2. User acceptance testing
3. Deploy to production
4. Monitor for issues

**Deliverables:**
- Deployment checklist
- Rollback plan
- Monitoring dashboard

---

## Testing Strategy

### Unit Tests (Resolver Level)

Test each resolver with:
- Valid inputs
- Invalid inputs
- Edge cases (empty results, null values)
- Different user contexts (guest, auth, admin, owner)

### Integration Tests (API Level)

Test complete workflows:
- Guest browsing clubs/events/shops
- User creating and viewing their own content
- Admin approving content
- Authorization failures

### Security Tests

Verify:
- Guests cannot access unapproved data
- Users cannot access other users' unapproved data
- Non-admins cannot access admin queries
- Direct model queries are blocked

### Test Cases

#### Test Case 1: Guest User - Public Clubs
```typescript
// Should succeed
const { data } = await client.queries.listPublicClubs();
expect(data).toBeDefined();
expect(data.every(club => club.approved === true)).toBe(true);

// Should fail
try {
  await client.models.Club.list();
  fail('Should have thrown authorization error');
} catch (error) {
  expect(error.message).toContain('Unauthorized');
}
```

#### Test Case 2: Authenticated User - Own Unapproved Content
```typescript
// Create unapproved club
const { data: club } = await client.models.Club.create({
  name: 'Test Club',
  approved: false
});

// Should see own unapproved club
const { data: myClubs } = await client.queries.listMyClubs();
expect(myClubs.some(c => c.id === club.id)).toBe(true);

// Should NOT appear in public list
const { data: publicClubs } = await client.queries.listPublicClubs();
expect(publicClubs.some(c => c.id === club.id)).toBe(false);
```

#### Test Case 3: Admin - Unapproved Content
```typescript
// Should see all unapproved clubs
const { data: unapproved } = await client.queries.listUnapprovedClubs();
expect(unapproved.every(club => club.approved === false)).toBe(true);

// Should see all clubs
const { data: all } = await client.queries.listAllClubs();
expect(all.length).toBeGreaterThanOrEqual(unapproved.length);
```

---

## Migration Guide

### For Developers

1. **Update imports**: No changes needed, same client
2. **Replace queries**: Use custom queries instead of model queries
3. **Remove filters**: Approval filtering handled by resolvers
4. **Test thoroughly**: Verify all user flows work

### For Users

- No changes required
- Improved security (unapproved content hidden)
- Faster page loads (optimized queries)

### Rollback Plan

If issues arise:
1. Revert schema changes (restore guest read access)
2. Revert frontend changes (use old queries)
3. Keep resolver files for future use
4. Investigate and fix issues
5. Re-deploy when ready

---

## Resolver File Structure

```
amplify/
└── data/
    ├── resource.ts (schema definition)
    └── resolvers/
        ├── clubs/
        │   ├── listPublicClubs.js
        │   ├── getPublicClub.js
        │   ├── listMyClubs.js
        │   ├── listUnapprovedClubs.js
        │   └── listAllClubs.js
        ├── chapters/
        │   ├── listPublicChapters.js
        │   ├── listPublicChaptersInBounds.js
        │   ├── getPublicChapter.js
        │   ├── listMyChapters.js
        │   ├── listUnapprovedChapters.js
        │   └── listAllChapters.js
        ├── shops/
        │   ├── listPublicShops.js
        │   ├── listPublicShopsInBounds.js
        │   ├── getPublicShop.js
        │   ├── listMyShops.js
        │   ├── listUnapprovedShops.js
        │   └── listAllShops.js
        └── events/
            ├── listPublicEvents.js
            ├── getPublicEvent.js
            ├── listMyEvents.js
            ├── listUnapprovedEvents.js
            └── listAllEvents.js
```

---

## Next Steps

1. **Review this document** with the team
2. **Approve the implementation plan**
3. **Create resolver files** (see Phase 1)
4. **Update schema** (see Phase 2)
5. **Refactor frontend** (see Phase 3)
6. **Test thoroughly** (see Phase 4)
7. **Deploy** (see Phase 5)

---

## Appendix: Example Resolver Implementations

### A. listPublicClubs.js

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved',
      expressionValues: {
        ':approved': { BOOL: true }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### B. listMyClubs.js

```javascript
export function request(ctx) {
  const userId = ctx.identity.sub;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'contains(#owners, :userId)',
      expressionNames: {
        '#owners': 'owners'
      },
      expressionValues: {
        ':userId': { S: userId }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### C. listPublicChaptersInBounds.js

```javascript
export function request(ctx) {
  const { minLat, maxLat, minLng, maxLng, clubIds } = ctx.args;
  
  let expression = 'approved = :approved AND latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng';
  const expressionValues = {
    ':approved': { BOOL: true },
    ':minLat': { N: minLat.toString() },
    ':maxLat': { N: maxLat.toString() },
    ':minLng': { N: minLng.toString() },
    ':maxLng': { N: maxLng.toString() }
  };
  
  // Add club filter if provided
  if (clubIds && clubIds.length > 0) {
    const clubConditions = clubIds.map((_, i) => `clubId = :clubId${i}`).join(' OR ');
    expression += ` AND (${clubConditions})`;
    clubIds.forEach((id, i) => {
      expressionValues[`:clubId${i}`] = { S: id };
    });
  }
  
  return {
    operation: 'Scan',
    filter: {
      expression,
      expressionValues
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### D. listMyEvents.js

```javascript
export function request(ctx) {
  const userId = ctx.identity.sub;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved OR contains(#owners, :userId)',
      expressionNames: {
        '#owners': 'owners'
      },
      expressionValues: {
        ':approved': { BOOL: true },
        ':userId': { S: userId }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-16 | System | Initial document creation |

---

**End of Document**
