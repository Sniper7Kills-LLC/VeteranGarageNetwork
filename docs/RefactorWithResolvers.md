# Data Access Refactoring with AppSync JavaScript Resolvers

## Overview

This document outlines the refactoring plan to secure data access in the VGN application by implementing server-side filtering using AWS AppSync JavaScript resolvers with pipeline architecture.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Architecture](#solution-architecture)
3. [Folder Structure](#folder-structure)
4. [Authorization Strategy](#authorization-strategy)
5. [Resolver Implementation](#resolver-implementation)
6. [Schema Definitions](#schema-definitions)
7. [Frontend Updates](#frontend-updates)
8. [Implementation Checklist](#implementation-checklist)
9. [Testing Strategy](#testing-strategy)

---

## Problem Statement

### Current Security Issue

The application currently uses **client-side filtering** to show only approved items:

```typescript
// ❌ INSECURE: Client-side filtering can be bypassed
const { data } = await client.models.Shop.list({
  filter: { approved: { eq: true } }
});
```

**Problems:**
- ✗ Users can modify GraphQL queries to bypass `approved` filter
- ✗ Unapproved data is accessible via direct model queries
- ✗ No server-side enforcement of approval status
- ✗ Security relies on client-side code (easily bypassed)

### Required Solution

Implement **server-side filtering** that:
- ✓ Enforces `approved = true` filter at the database level
- ✓ Cannot be bypassed by modifying client queries
- ✓ Filters nested associations (clubs, chapters, shops)
- ✓ Maintains admin access to all data for approval workflow
- ✓ Supports owner access to their own items (any status)

---

## Solution Architecture

### AppSync JavaScript Resolvers

We use **AppSync JavaScript resolvers** (not VTL) because:
- ✓ No cold starts (runs directly in AppSync)
- ✓ No Lambda charges
- ✓ TypeScript support for type safety
- ✓ Perfect for filtering operations
- ✓ Native Gen2 approach

### Pipeline Resolvers

For queries with nested data, we use **pipeline resolvers**:

```
Query Request
    ↓
[Step 1] → Fetch main items (approved only)
    ↓
[Step 2] → Fetch associations (approved only)
    ↓
[Step 3] → Fetch related items (approved only)
    ↓
[Step 4] → Merge and return results
    ↓
Response
```

**Key Benefits:**
- Each step filters for `approved = true`
- No unapproved data can leak
- Reusable resolver functions
- GraphQL selection sets work normally

---

## Folder Structure

```
amplify/data/resolvers/
├── shared/
│   ├── FetchApprovedShopClubAssociations.ts       # Fetch approved shop-club associations
│   ├── FetchApprovedShopChapterAssociations.ts    # Fetch approved shop-chapter associations
│   ├── FetchApprovedEventChapterAssociations.ts   # Fetch approved event-chapter associations
│   ├── FetchApprovedClubs.ts                      # Fetch approved clubs by IDs
│   ├── FetchApprovedChapters.ts                   # Fetch approved chapters by IDs
│   ├── FetchApprovedShops.ts                      # Fetch approved shops by IDs
│   ├── FetchApprovedEvents.ts                     # Fetch approved events by IDs
│   ├── FetchChapterRoles.ts                       # Fetch roles for chapters
│   ├── FetchAllShopClubAssociations.ts            # Fetch ALL shop-club associations (admin)
│   ├── FetchAllShopChapterAssociations.ts         # Fetch ALL shop-chapter associations (admin)
│   ├── FetchAllEventChapterAssociations.ts        # Fetch ALL event-chapter associations (admin)
│   ├── FetchAllClubs.ts                           # Fetch ALL clubs by IDs (admin)
│   ├── FetchAllChapters.ts                        # Fetch ALL chapters by IDs (admin)
│   ├── FetchAllShops.ts                           # Fetch ALL shops by IDs (admin)
│   └── FetchAllEvents.ts                          # Fetch ALL events by IDs (admin)
│
├── clubs/
│   ├── List.ts                               # Public: approved only
│   ├── ListByType.ts                         # Public: approved only by type
│   ├── Get.ts                                # Public: approved only
│   ├── MyList.ts                             # Owner: my clubs (any status)
│   ├── MyGet.ts                              # Owner: my club (any status)
│   ├── AdminList.ts                          # Admin: ALL clubs (no filtering)
│   └── AdminGet.ts                           # Admin: ANY club (no filtering)
│
├── chapters/
│   ├── List.ts                               # Public: approved only
│   ├── Get.ts                                # Public: approved only
│   ├── MyList.ts                             # Owner: my chapters
│   ├── MyGet.ts                              # Owner: my chapter
│   ├── AdminList.ts                          # Admin: ALL chapters
│   └── AdminGet.ts                           # Admin: ANY chapter
│
├── shops/
│   ├── List.ts                               # Public: approved only
│   ├── Get.ts                                # Public: approved only
│   ├── MyList.ts                             # Owner: my shops
│   ├── MyGet.ts                              # Owner: my shop
│   ├── AdminList.ts                          # Admin: ALL shops
│   └── AdminGet.ts                           # Admin: ANY shop
│
└── events/
    ├── List.ts                               # Public: approved only
    ├── Get.ts                                # Public: approved only
    ├── MyList.ts                             # Owner: my events
    ├── MyGet.ts                              # Owner: my event
    ├── AdminList.ts                          # Admin: ALL events
    └── AdminGet.ts                           # Admin: ANY event
```

### Naming Conventions

- **List.ts** - List all approved items (public access)
- **Get.ts** - Get single approved item (public access)
- **MyList.ts** - List user's own items (owner access, any status)
- **MyGet.ts** - Get user's own item (owner access, any status)
- **AdminList.ts** - List all items without filtering (admin only)
- **AdminGet.ts** - Get any item without filtering (admin only)

### Shared Resolvers

Shared resolvers are **reusable pipeline steps** that can be composed into different queries:

- **FetchApproved*.ts** - Fetch only approved items
- **FetchAll*.ts** - Fetch all items (admin use)
- **FetchChapterRoles.ts** - Fetch roles for chapters

### Association Model Naming

Association models follow a consistent naming pattern where they are prefixed with the entity they connect to:

- **ShopClubAssociation** - Links Shops ↔ Clubs (many-to-many)
- **ShopChapterAssociation** - Links Shops ↔ Chapters (many-to-many)
- **EventChapterAssociation** - Links Events ↔ Chapters (many-to-many)

This naming makes it immediately clear what entities are being associated, reducing confusion and improving code readability.

---

## Authorization Strategy

### Three Access Levels

#### 1. Public Access (Guest + Authenticated)

**Queries:** `listApprovedX`, `getApprovedX`

**Authorization:**
```typescript
.authorization((allow) => [
  allow.guest(),           // Unauthenticated users
  allow.authenticated()    // Authenticated users
])
```

**Behavior:**
- ✓ Only approved items returned
- ✓ Only approved associations returned
- ✓ Server-side filtering at every pipeline step
- ✓ Cannot be bypassed

#### 2. Owner Access (Authenticated)

**Queries:** `listMyX`, `getMyX`

**Authorization:**
```typescript
.authorization((allow) => [
  allow.authenticated()
])
```

**Behavior:**
- ✓ User's own items (any status)
- ✓ Uses `ctx.identity.sub` to filter by owner
- ✓ Can see their unapproved items
- ✓ Cannot see other users' unapproved items

#### 3. Admin Access (Admin Group)

**Queries:** `adminListAllX`, `adminGetX`

**Authorization:**
```typescript
.authorization((allow) => [
  allow.group('admin')
])
```

**Behavior:**
- ✓ ALL items (no filtering)
- ✓ ALL associations (no filtering)
- ✓ Full access for approval workflow
- ✓ Only admin group members

### Supported Authorization Rules for Custom Queries

From AWS Amplify Gen2 documentation, custom queries support:

**✅ Supported (Static Rules):**
- `allow.guest()` - Unauthenticated users
- `allow.publicApiKey()` - API key access
- `allow.authenticated()` - Any signed-in user
- `allow.group("Admin")` - Specific group
- `allow.groups(["Teacher", "Student"])` - Multiple groups

**❌ Not Supported (Dynamic Rules):**
- `allow.owner()` - Use `ctx.identity.sub` in resolver instead
- `allow.ownerDefinedIn()` - Use custom logic in resolver
- `allow.groupDefinedIn()` - Use custom logic in resolver

### Important Note on Ownership Patterns

The VGN schema uses two ownership patterns:

1. **Multiple Owners** (Club, ClubChapter, Shop, Event):
   - Uses `owners` array field (string array of Cognito sub IDs)
   - Model authorization: `allow.ownersDefinedIn('owners')`
   - In resolvers: Check if `ctx.identity.sub` is in the `owners` array

2. **Single Owner** (ChapterRole, Association tables):
   - Uses `owner` field (single string, auto-populated by Amplify)
   - Model authorization: `allow.owner()`
   - In resolvers: Check if `ctx.identity.sub` equals `owner` field

When implementing owner queries, use the appropriate pattern for each model.

---

## Resolver Implementation

### Basic Resolver Structure

Every resolver has two functions:

```typescript
// request: Transform GraphQL request to DynamoDB operation
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: { /* ... */ }
  };
}

// response: Transform DynamoDB response to GraphQL format
export function response(ctx) {
  return ctx.result.items;
}
```

### Example 1: Simple Public Query (Approved Only)

**File:** `amplify/data/resolvers/clubs/List.ts`

```typescript
/**
 * List all approved clubs
 * Public access (guest + authenticated)
 */
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
  return ctx.result.items || [];
}
```

### Example 2: Public Query with Arguments

**File:** `amplify/data/resolvers/clubs/ListByType.ts`

```typescript
/**
 * List approved clubs filtered by type
 * Public access (guest + authenticated)
 */
export function request(ctx) {
  const { types } = ctx.args;
  
  const filters = [
    { approved: { eq: true } }
  ];
  
  if (types && types.length > 0) {
    if (types.length === 1) {
      filters.push({ type: { eq: types[0] } });
    } else {
      filters.push({
        or: types.map(type => ({ type: { eq: type } }))
      });
    }
  }
  
  return {
    operation: 'Scan',
    filter: filters.length > 1 ? { and: filters } : filters[0]
  };
}

export function response(ctx) {
  return ctx.result.items || [];
}
```

### Example 3: Owner Query (My Items)

**File:** `amplify/data/resolvers/clubs/MyList.ts`

```typescript
/**
 * List user's own clubs (any status)
 * Owner access (authenticated)
 */
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
  return ctx.result.items || [];
}
```

### Example 4: Admin Query (No Filtering)

**File:** `amplify/data/resolvers/clubs/AdminList.ts`

```typescript
/**
 * List ALL clubs (no filtering)
 * Admin access only
 */
export function request(ctx) {
  // No approved filter - return everything!
  return {
    operation: 'Scan'
  };
}

export function response(ctx) {
  return ctx.result.items || [];
}
```

### Example 5: Reusable Shared Resolver

**File:** `amplify/data/resolvers/shared/FetchApprovedShopClubAssociations.ts`

```typescript
/**
 * Reusable resolver: Fetch approved shop-club associations for given shop IDs
 * Input: ctx.prev.result should contain items with 'id' field (shops)
 * Output: Array of approved ShopClubAssociation items
 */
export function request(ctx) {
  const shops = ctx.prev.result;
  
  if (!shops || shops.length === 0) {
    return { operation: 'Scan', limit: 0 };
  }
  
  const shopIds = shops.map(shop => shop.id);
  
  return {
    operation: 'Scan',
    filter: {
      and: [
        { approved: { eq: true } },
        { or: shopIds.map(id => ({ shopId: { eq: id } })) }
      ]
    }
  };
}

export function response(ctx) {
  return ctx.result.items || [];
}
```

### Example 6: Reusable Shared Resolver with Merging

**File:** `amplify/data/resolvers/shared/FetchApprovedClubs.ts`

```typescript
/**
 * Reusable resolver: Fetch approved clubs by IDs and merge into associations
 * Input: ctx.prev.result should contain items with 'clubId' field (associations)
 * Output: Associations with nested club data
 */
export function request(ctx) {
  const associations = ctx.prev.result;
  
  if (!associations || associations.length === 0) {
    return { operation: 'Scan', limit: 0 };
  }
  
  // Get unique club IDs
  const clubIds = [...new Set(associations.map(a => a.clubId))];
  
  return {
    operation: 'Scan',
    filter: {
      and: [
        { approved: { eq: true } },
        { or: clubIds.map(id => ({ id: { eq: id } })) }
      ]
    }
  };
}

export function response(ctx) {
  const associations = ctx.prev.result;
  const clubs = ctx.result.items || [];
  
  // Merge clubs into associations
  return associations.map(assoc => ({
    ...assoc,
    club: clubs.find(club => club.id === assoc.clubId)
  }));
}
```

### Example 7: Admin Shared Resolver (No Filtering)

**File:** `amplify/data/resolvers/shared/FetchAllShopClubAssociations.ts`

```typescript
/**
 * Admin resolver: Fetch ALL shop-club associations (no approved filter)
 * Input: ctx.prev.result should contain items with 'id' field (shops)
 * Output: Array of ALL ShopClubAssociation items
 */
export function request(ctx) {
  const shops = ctx.prev.result;
  
  if (!shops || shops.length === 0) {
    return { operation: 'Scan', limit: 0 };
  }
  
  const shopIds = shops.map(shop => shop.id);
  
  return {
    operation: 'Scan',
    filter: {
      // No approved filter - just match shop IDs
      or: shopIds.map(id => ({ shopId: { eq: id } }))
    }
  };
}

export function response(ctx) {
  return ctx.result.items || [];
}
```

---

## Schema Definitions

### Simple Query (No Pipeline)

```typescript
// amplify/data/resource.ts

const schema = a.schema({
  // ... existing models ...

  listApprovedClubs: a
    .query()
    .returns(a.ref('Club').array())
    .handler(a.handler.custom({
      dataSource: a.ref('Club'),
      entry: './resolvers/clubs/List.ts'
    }))
    .authorization((allow) => [
      allow.guest(),
      allow.authenticated()
    ]),
});
```

### Query with Arguments

```typescript
listApprovedClubsByType: a
  .query()
  .arguments({
    types: a.string().array()
  })
  .returns(a.ref('Club').array())
  .handler(a.handler.custom({
    dataSource: a.ref('Club'),
    entry: './resolvers/clubs/ListByType.ts'
  }))
  .authorization((allow) => [
    allow.guest(),
    allow.authenticated()
  ]),
```

### Pipeline Query (Multiple Steps)

```typescript
listApprovedShops: a
  .query()
  .arguments({
    minLat: a.float(),
    maxLat: a.float(),
    minLng: a.float(),
    maxLng: a.float()
  })
  .returns(a.ref('Shop').array())
  .handler([
    // Step 1: Fetch shops (approved only)
    a.handler.custom({
      dataSource: a.ref('Shop'),
      entry: './resolvers/shops/List.ts'
    }),
    // Step 2: Fetch shop-club associations (approved only)
    a.handler.custom({
      dataSource: a.ref('ShopClubAssociation'),
      entry: './resolvers/shared/FetchApprovedShopClubAssociations.ts'
    }),
    // Step 3: Fetch clubs (approved only) and merge
    a.handler.custom({
      dataSource: a.ref('Club'),
      entry: './resolvers/shared/FetchApprovedClubs.ts'
    })
  ])
  .authorization((allow) => [
    allow.guest(),
    allow.authenticated()
  ]),
```

### Owner Query

```typescript
listMyClubs: a
  .query()
  .returns(a.ref('Club').array())
  .handler(a.handler.custom({
    dataSource: a.ref('Club'),
    entry: './resolvers/clubs/MyList.ts'
  }))
  .authorization((allow) => [
    allow.authenticated()
  ]),
```

### Admin Query

```typescript
adminListAllClubs: a
  .query()
  .returns(a.ref('Club').array())
  .handler(a.handler.custom({
    dataSource: a.ref('Club'),
    entry: './resolvers/clubs/AdminList.ts'
  }))
  .authorization((allow) => [
    allow.group('admin')
  ]),
```

### Admin Pipeline Query (No Filtering)

```typescript
adminListAllShops: a
  .query()
  .arguments({
    minLat: a.float(),
    maxLat: a.float(),
    minLng: a.float(),
    maxLng: a.float()
  })
  .returns(a.ref('Shop').array())
  .handler([
    // Step 1: Fetch ALL shops (no filter)
    a.handler.custom({
      dataSource: a.ref('Shop'),
      entry: './resolvers/shops/AdminList.ts'
    }),
    // Step 2: Fetch ALL shop-club associations (no filter)
    a.handler.custom({
      dataSource: a.ref('ShopClubAssociation'),
      entry: './resolvers/shared/FetchAllShopClubAssociations.ts'
    }),
    // Step 3: Fetch ALL clubs (no filter) and merge
    a.handler.custom({
      dataSource: a.ref('Club'),
      entry: './resolvers/shared/FetchAllClubs.ts'
    })
  ])
  .authorization((allow) => [
    allow.group('admin')
  ]),
```

---

## Frontend Updates

### Before (Insecure)

```typescript
// ❌ Client-side filtering - can be bypassed
const { data: shops } = await client.models.Shop.list({
  filter: { approved: { eq: true } }
});
```

### After (Secure)

```typescript
// ✅ Server-side filtering - cannot be bypassed
const { data: shops } = await client.queries.listApprovedShops({
  minLat: bounds.southWest.lat,
  maxLat: bounds.northEast.lat,
  minLng: bounds.southWest.lng,
  maxLng: bounds.northEast.lng
});
```

### GraphQL Selection Sets

You can still use selection sets to request only the fields you need:

```typescript
// Get shop with club names only
const { data: shop } = await client.queries.getApprovedShop(
  { id: 'shop-123' },
  {
    selectionSet: [
      'id',
      'name',
      'clubAssociations.club.name'
    ]
  }
);

// Access nested data
shop?.clubAssociations?.forEach(assoc => {
  console.log(assoc.club?.name); // ✅ Type-safe
});
```

### Usage by Access Level

**Public (Guest/Authenticated):**
```typescript
// Only sees approved items
const { data } = await client.queries.listApprovedShops();
const { data } = await client.queries.getApprovedClub({ id: 'club-123' });
```

**Owner (Authenticated):**
```typescript
// Sees their own items (any status)
const { data } = await client.queries.listMyShops();
const { data } = await client.queries.getMyClub({ id: 'club-123' });
```

**Admin (Admin Group):**
```typescript
// Sees everything (for approval workflow)
const { data } = await client.queries.adminListAllShops();
const { data } = await client.queries.adminGetClub({ id: 'club-123' });
```

---

## Implementation Checklist

### Phase 1: Create Shared Resolvers

- [ ] Create `amplify/data/resolvers/shared/` directory
- [ ] Implement `FetchApprovedShopClubAssociations.ts`
- [ ] Implement `FetchApprovedShopChapterAssociations.ts`
- [ ] Implement `FetchApprovedEventChapterAssociations.ts`
- [ ] Implement `FetchApprovedClubs.ts`
- [ ] Implement `FetchApprovedChapters.ts`
- [ ] Implement `FetchApprovedShops.ts`
- [ ] Implement `FetchApprovedEvents.ts`
- [ ] Implement `FetchChapterRoles.ts`
- [ ] Implement `FetchAllShopClubAssociations.ts` (admin)
- [ ] Implement `FetchAllShopChapterAssociations.ts` (admin)
- [ ] Implement `FetchAllEventChapterAssociations.ts` (admin)
- [ ] Implement `FetchAllClubs.ts` (admin)
- [ ] Implement `FetchAllChapters.ts` (admin)
- [ ] Implement `FetchAllShops.ts` (admin)
- [ ] Implement `FetchAllEvents.ts` (admin)

### Phase 2: Create Club Resolvers

- [ ] Create `amplify/data/resolvers/clubs/` directory
- [ ] Implement `List.ts` (public, approved only)
- [ ] Implement `ListByType.ts` (public, approved only)
- [ ] Implement `Get.ts` (public, approved only)
- [ ] Implement `MyList.ts` (owner, any status)
- [ ] Implement `MyGet.ts` (owner, any status)
- [ ] Implement `AdminList.ts` (admin, no filter)
- [ ] Implement `AdminGet.ts` (admin, no filter)

### Phase 3: Create Chapter Resolvers

- [ ] Create `amplify/data/resolvers/chapters/` directory
- [ ] Implement `List.ts` (public, approved only)
- [ ] Implement `Get.ts` (public, approved only)
- [ ] Implement `MyList.ts` (owner, any status)
- [ ] Implement `MyGet.ts` (owner, any status)
- [ ] Implement `AdminList.ts` (admin, no filter)
- [ ] Implement `AdminGet.ts` (admin, no filter)

### Phase 4: Create Shop Resolvers

- [ ] Create `amplify/data/resolvers/shops/` directory
- [ ] Implement `List.ts` (public, approved only)
- [ ] Implement `Get.ts` (public, approved only)
- [ ] Implement `MyList.ts` (owner, any status)
- [ ] Implement `MyGet.ts` (owner, any status)
- [ ] Implement `AdminList.ts` (admin, no filter)
- [ ] Implement `AdminGet.ts` (admin, no filter)

### Phase 5: Create Event Resolvers

- [ ] Create `amplify/data/resolvers/events/` directory
- [ ] Implement `List.ts` (public, approved only)
- [ ] Implement `Get.ts` (public, approved only)
- [ ] Implement `MyList.ts` (owner, any status)
- [ ] Implement `MyGet.ts` (owner, any status)
- [ ] Implement `AdminList.ts` (admin, no filter)
- [ ] Implement `AdminGet.ts` (admin, no filter)

### Phase 6: Update Schema

- [ ] Add custom queries for clubs (public, owner, admin)
- [ ] Add custom queries for chapters (public, owner, admin)
- [ ] Add custom queries for shops (public, owner, admin)
- [ ] Add custom queries for events (public, owner, admin)
- [ ] Configure pipeline handlers for nested data queries
- [ ] Set proper authorization rules for each query

### Phase 7: Update Frontend - Shops Page

- [ ] Replace `client.models.Club.list()` with `client.queries.listApprovedClubs()`
- [ ] Replace `client.models.Shop.list()` with `client.queries.listApprovedShops()`
- [ ] Remove client-side `approved: { eq: true }` filters
- [ ] Update TypeScript types for new query responses
- [ ] Test shop listing with geographic bounds
- [ ] Test shop detail view with nested associations

### Phase 8: Update Frontend - Clubs Page

- [ ] Replace `client.models.Club.list()` with `client.queries.listApprovedClubsByType()`
- [ ] Replace `client.models.ClubChapter.list()` with `client.queries.listApprovedChapters()`
- [ ] Remove client-side `approved: { eq: true }` filters
- [ ] Update TypeScript types for new query responses
- [ ] Test chapter listing with club filters
- [ ] Test chapter detail view with nested club and roles

### Phase 9: Lock Down Model Access

- [ ] Remove `allow.guest().to(['read'])` from Club model
- [ ] Remove `allow.authenticated().to(['read'])` from Club model (keep owner and admin)
- [ ] Remove `allow.guest().to(['read'])` from ClubChapter model
- [ ] Remove `allow.authenticated().to(['read'])` from ClubChapter model (keep owner and admin)
- [ ] Remove `allow.guest().to(['read'])` from Shop model
- [ ] Remove `allow.authenticated().to(['read'])` from Shop model (keep owner and admin)
- [ ] Remove `allow.guest().to(['read'])` from Event model
- [ ] Remove `allow.authenticated().to(['read'])` from Event model (keep owner and admin)
- [ ] Keep admin group access for direct model queries
- [ ] Keep owner access for CRUD operations

### Phase 10: Testing

- [ ] Test as guest user (unauthenticated)
- [ ] Test as authenticated user (non-owner)
- [ ] Test as owner (own items)
- [ ] Test as admin user
- [ ] Verify no unapproved data leaks in any scenario
- [ ] Test GraphQL selection sets work correctly
- [ ] Test pagination if implemented
- [ ] Test error handling for missing data
- [ ] Performance testing for pipeline resolvers

---

## Testing Strategy

### Test Scenarios

#### 1. Guest User (Unauthenticated)

**Expected Behavior:**
- ✓ Can list approved clubs, chapters, shops, events
- ✓ Can get single approved items
- ✓ Cannot see unapproved items
- ✓ Cannot access owner queries
- ✓ Cannot access admin queries

**Test Cases:**
```typescript
// Should succeed
await client.queries.listApprovedClubs();
await client.queries.getApprovedClub({ id: 'approved-club-id' });

// Should fail (authorization error)
await client.queries.listMyClubs();
await client.queries.adminListAllClubs();

// Should return null (item not approved)
await client.queries.getApprovedClub({ id: 'unapproved-club-id' });
```

#### 2. Authenticated User (Non-Owner)

**Expected Behavior:**
- ✓ Can list approved clubs, chapters, shops, events
- ✓ Can get single approved items
- ✓ Cannot see unapproved items (except their own)
- ✓ Can access owner queries (sees only their items)
- ✓ Cannot access admin queries

**Test Cases:**
```typescript
// Should succeed
await client.queries.listApprovedClubs();
await client.queries.listMyClubs(); // Only their clubs

// Should fail (authorization error)
await client.queries.adminListAllClubs();

// Should return null (not owner and not approved)
await client.queries.getApprovedClub({ id: 'other-users-unapproved-club' });
```

#### 3. Owner User

**Expected Behavior:**
- ✓ Can list approved clubs, chapters, shops, events
- ✓ Can get single approved items
- ✓ Can see their own unapproved items via owner queries
- ✓ Cannot see other users' unapproved items
- ✓ Cannot access admin queries

**Test Cases:**
```typescript
// Should succeed
await client.queries.listMyClubs(); // Includes their unapproved clubs
await client.queries.getMyClub({ id: 'my-unapproved-club' });

// Should fail (authorization error)
await client.queries.adminListAllClubs();

// Should return null (not owner)
await client.queries.getMyClub({ id: 'other-users-club' });
```

#### 4. Admin User

**Expected Behavior:**
- ✓ Can list approved clubs, chapters, shops, events
- ✓ Can get single approved items
- ✓ Can list ALL items (approved + unapproved) via admin queries
- ✓ Can get ANY item (approved + unapproved) via admin queries
- ✓ Full access for approval workflow

**Test Cases:**
```typescript
// Should succeed
await client.queries.listApprovedClubs();
await client.queries.adminListAllClubs(); // All clubs
await client.queries.adminGetClub({ id: 'any-club-id' }); // Any club

// Should return all items (approved + unapproved)
const { data } = await client.queries.adminListAllClubs();
// Verify data includes both approved and unapproved items
```

### Security Verification

**Critical Tests:**

1. **Bypass Attempt - Direct Model Query:**
```typescript
// Should fail after model access is locked down
try {
  await client.models.Club.list({
    filter: { approved: { eq: false } }
  });
  // Should throw authorization error
} catch (error) {
  console.log('✓ Direct model access blocked');
}
```

2. **Bypass Attempt - Modified GraphQL Query:**
```typescript
// Even if user modifies the query, server enforces approved filter
const { data } = await client.queries.listApprovedClubs();
// Verify all items have approved = true
data.every(club => club.approved === true);
```

3. **Nested Data Leak Check:**
```typescript
// Verify nested associations are also filtered
const { data } = await client.queries.listApprovedShops();
data.forEach(shop => {
  shop.clubAssociations?.forEach(assoc => {
    // Association should be approved
    assert(assoc.approved === true);
    // Nested club should be approved
    assert(assoc.club?.approved === true);
  });
});
```

### Performance Testing

**Metrics to Monitor:**
- Query response time for list operations
- Query response time for get operations
