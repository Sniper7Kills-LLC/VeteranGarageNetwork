# Frontend Resolver Migration Guide

**Date**: October 16, 2025  
**Status**: 🚧 In Progress  
**Purpose**: Migrate front-end code from direct model access to custom resolver queries

---

## Table of Contents

1. [Overview](#overview)
2. [Why Migrate?](#why-migrate)
3. [Migration Patterns](#migration-patterns)
4. [Resolver Quick Reference](#resolver-quick-reference)
5. [File-by-File Migration Plan](#file-by-file-migration-plan)
6. [Testing Checklist](#testing-checklist)
7. [Common Pitfalls](#common-pitfalls)

---

## Overview

This guide documents the migration from direct model access (`client.models.X.list()`) to custom resolver queries (`client.queries.X()`). The custom resolvers provide server-side approval filtering and authorization, replacing client-side filtering logic.

### What's Changing

**Before (Old Pattern):**
```typescript
const { data } = await client.models.Club.list({
  filter: { approved: { eq: true } },
  authMode: 'userPool'
});
```

**After (New Pattern):**
```typescript
const { data } = await client.queries.listPublicClubs({
  authMode: 'userPool'
});
```

---

## Why Migrate?

### Security Benefits
- ✅ **Server-side enforcement** - Approval filtering happens at the database level
- ✅ **Cannot be bypassed** - No way for users to access unapproved content
- ✅ **Consistent authorization** - Single source of truth for access rules

### Performance Benefits
- ✅ **Database-level filtering** - More efficient than client-side filtering
- ✅ **Reduced data transfer** - Only approved items are returned
- ✅ **Geographic filtering** - Server-side bounds filtering for maps

### Maintainability Benefits
- ✅ **Centralized logic** - Approval rules in one place (resolvers)
- ✅ **Easier updates** - Change resolver, not every component
- ✅ **Type safety** - Generated TypeScript types for all queries

---

## Migration Patterns

### Pattern 1: Public List Queries (Guest + Authenticated)

**Use Case**: Display approved content to all users

**Before:**
```typescript
const { data: clubs } = await client.models.Club.list({
  filter: { approved: { eq: true } },
  authMode: authStatus === 'authenticated' ? 'userPool' : 'identityPool'
});
```

**After:**
```typescript
const { data: clubs } = await client.queries.listPublicClubs({
  authMode: authStatus === 'authenticated' ? 'userPool' : 'identityPool'
});
```

**Available Resolvers:**
- `listPublicClubs()` - All approved clubs
- `listPublicChapters({ minLat?, maxLat?, minLng?, maxLng?, clubIds? })` - Approved chapters with optional filtering
- `listPublicShops({ minLat?, maxLat?, minLng?, maxLng? })` - Approved shops with optional geographic filtering
- `listPublicEvents({ minLat?, maxLat?, minLng?, maxLng? })` - Approved events with optional geographic filtering

---

### Pattern 2: Public Single Item Queries (Guest + Authenticated)

**Use Case**: Get a single approved item by ID

**Before:**
```typescript
const { data: club } = await client.models.Club.get(
  { id: clubId },
  { 
    filter: { approved: { eq: true } },
    authMode: 'identityPool'
  }
);
```

**After:**
```typescript
const { data: club } = await client.queries.getPublicClub({
  id: clubId,
  authMode: 'identityPool'
});
```

**Available Resolvers:**
- `getPublicClub({ id })` - Single approved club
- `getPublicChapter({ id })` - Single approved chapter
- `getPublicShop({ id })` - Single approved shop
- `getPublicEvent({ id })` - Single approved event

---

### Pattern 3: User's Own Content (Authenticated Only)

**Use Case**: Show user their own content (approved + unapproved)

**Before:**
```typescript
const session = await fetchAuthSession();
const userId = session.tokens?.idToken?.payload.sub as string;

const { data: clubs } = await client.models.Club.list({
  filter: { owners: { contains: userId } },
  authMode: 'userPool'
});
```

**After:**
```typescript
// No need to fetch userId - resolver handles it automatically
const { data: clubs } = await client.queries.listMyClubs({
  authMode: 'userPool'
});

// Optional: Filter by approval status
const { data: unapprovedClubs } = await client.queries.listMyClubs({
  approved: false,
  authMode: 'userPool'
});
```

**Available Resolvers:**
- `listMyClubs({ approved? })` - User's clubs
- `listMyChapters({ approved?, minLat?, maxLat?, minLng?, maxLng? })` - User's chapters
- `listMyShops({ approved?, minLat?, maxLat?, minLng?, maxLng? })` - User's shops
- `listMyEvents({ approved?, minLat?, maxLat?, minLng?, maxLng? })` - User's events

---

### Pattern 4: Admin Unapproved Content (Admin Only)

**Use Case**: Admin approval workflow - list items pending approval

**Before:**
```typescript
const { data: clubs } = await client.models.Club.list({
  filter: { approved: { eq: false } },
  authMode: 'userPool'
});
```

**After:**
```typescript
const { data: clubs } = await client.queries.listUnapprovedClubs({
  authMode: 'userPool'
});
```

**Available Resolvers:**
- `listUnapprovedClubs()` - All unapproved clubs
- `listUnapprovedChapters({ minLat?, maxLat?, minLng?, maxLng? })` - All unapproved chapters
- `listUnapprovedShops({ minLat?, maxLat?, minLng?, maxLng? })` - All unapproved shops
- `listUnapprovedEvents({ minLat?, maxLat?, minLng?, maxLng? })` - All unapproved events

---

### Pattern 5: Admin All Content (Admin Only)

**Use Case**: Admin needs to see all content with optional filtering

**Before:**
```typescript
// Get all clubs
const { data: allClubs } = await client.models.Club.list({
  authMode: 'userPool'
});

// Or filter by approval
const { data: approvedClubs } = await client.models.Club.list({
  filter: { approved: { eq: true } },
  authMode: 'userPool'
});
```

**After:**
```typescript
// Get all clubs
const { data: allClubs } = await client.queries.listAllClubs({
  authMode: 'userPool'
});

// Or filter by approval
const { data: approvedClubs } = await client.queries.listAllClubs({
  approved: true,
  authMode: 'userPool'
});
```

**Available Resolvers:**
- `listAllClubs({ approved? })` - All clubs with optional approval filter
- `listAllChapters({ approved?, minLat?, maxLat?, minLng?, maxLng? })` - All chapters
- `listAllShops({ approved?, minLat?, maxLat?, minLng?, maxLng? })` - All shops
- `listAllEvents({ approved?, minLat?, maxLat?, minLng?, maxLng? })` - All events

---

### Pattern 6: Association Queries (Guest + Authenticated)

**Use Case**: Get approved associations between entities

**Before:**
```typescript
// This would return ALL associations, including unapproved ones
const { data: event } = await client.models.Event.get(
  { id: eventId },
  { 
    selectionSet: ['id', 'title', 'chapterAssociations.*'],
    authMode: 'identityPool'
  }
);
// event.chapterAssociations includes unapproved associations ❌
```

**After:**
```typescript
// Get the event
const { data: event } = await client.queries.getPublicEvent({
  id: eventId,
  authMode: 'identityPool'
});

// Get only approved chapter associations
const { data: associations } = await client.queries.listPublicEventAssociations({
  eventId: eventId,
  authMode: 'identityPool'
});
```

**Available Resolvers:**
- `listPublicClubChapters({ clubId, minLat?, maxLat?, minLng?, maxLng? })` - Approved chapters for a club
- `listPublicClubAssociations({ clubId })` - Approved shop associations for a club
- `listPublicChapterAssociations({ chapterId })` - Approved shop associations for a chapter
- `listPublicEventAssociations({ eventId })` - Approved chapter associations for an event

---

### Pattern 7: Geographic Filtering

**Use Case**: Filter items by map bounds

**Before:**
```typescript
// Fetch all, then filter client-side
const { data: allChapters } = await client.models.ClubChapter.list({
  filter: { approved: { eq: true } },
  authMode: 'identityPool'
});

// Client-side filtering
const filteredChapters = allChapters.filter(chapter => 
  chapter.latitude >= minLat && chapter.latitude <= maxLat &&
  chapter.longitude >= minLng && chapter.longitude <= maxLng
);
```

**After:**
```typescript
// Server-side filtering - much more efficient
const { data: chapters } = await client.queries.listPublicChapters({
  minLat: mapBounds.southWest.lat,
  maxLat: mapBounds.northEast.lat,
  minLng: mapBounds.southWest.lng,
  maxLng: mapBounds.northEast.lng,
  authMode: 'identityPool'
});
```

---

### Pattern 8: Complex Event Queries (Approved + User's Unapproved)

**Use Case**: Show approved events to everyone, plus user's own unapproved events

**Before:**
```typescript
// Fetch approved events
const { data: approvedEvents } = await client.models.Event.list({
  filter: { approved: { eq: true } },
  authMode: 'identityPool'
});

let allEvents = approvedEvents;

// If authenticated, also fetch user's unapproved events
if (authStatus === 'authenticated' && userId) {
  const { data: userEvents } = await client.models.Event.list({
    filter: { 
      and: [
        { approved: { eq: false } },
        { owners: { contains: userId } }
      ]
    },
    authMode: 'userPool'
  });
  
  allEvents = [...approvedEvents, ...userEvents];
}
```

**After:**
```typescript
// Fetch approved events
const { data: approvedEvents } = await client.queries.listPublicEvents({
  authMode: authStatus === 'authenticated' ? 'userPool' : 'identityPool'
});

let allEvents = approvedEvents || [];

// If authenticated, also fetch user's unapproved events
if (authStatus === 'authenticated') {
  const { data: userEvents } = await client.queries.listMyEvents({
    approved: false,
    authMode: 'userPool'
  });
  
  allEvents = [...approvedEvents, ...(userEvents || [])];
}
```

---

## Resolver Quick Reference

### Public Access (Guest + Authenticated)

| Resolver | Parameters | Returns | Use Case |
|----------|-----------|---------|----------|
| `listPublicClubs()` | None | Club[] | All approved clubs |
| `getPublicClub({ id })` | id: string | Club | Single approved club |
| `listPublicChapters({ minLat?, maxLat?, minLng?, maxLng?, clubIds? })` | Geographic bounds, club filter | ClubChapter[] | Approved chapters with filtering |
| `getPublicChapter({ id })` | id: string | ClubChapter | Single approved chapter |
| `listPublicShops({ minLat?, maxLat?, minLng?, maxLng? })` | Geographic bounds | Shop[] | Approved shops with filtering |
| `getPublicShop({ id })` | id: string | Shop | Single approved shop |
| `listPublicEvents({ minLat?, maxLat?, minLng?, maxLng? })` | Geographic bounds | Event[] | Approved events with filtering |
| `getPublicEvent({ id })` | id: string | Event | Single approved event |

### Authenticated User Access

| Resolver | Parameters | Returns | Use Case |
|----------|-----------|---------|----------|
| `listMyClubs({ approved? })` | approved?: boolean | Club[] | User's clubs (all or filtered) |
| `listMyChapters({ approved?, minLat?, maxLat?, minLng?, maxLng? })` | Approval + geographic | ClubChapter[] | User's chapters |
| `listMyShops({ approved?, minLat?, maxLat?, minLng?, maxLng? })` | Approval + geographic | Shop[] | User's shops |
| `listMyEvents({ approved?, minLat?, maxLat?, minLng?, maxLng? })` | Approval + geographic | Event[] | User's events |

### Admin Access

| Resolver | Parameters | Returns | Use Case |
|----------|-----------|---------|----------|
| `listUnapprovedClubs()` | None | Club[] | Clubs pending approval |
| `listUnapprovedChapters({ minLat?, maxLat?, minLng?, maxLng? })` | Geographic bounds | ClubChapter[] | Chapters pending approval |
| `listUnapprovedShops({ minLat?, maxLat?, minLng?, maxLng? })` | Geographic bounds | Shop[] | Shops pending approval |
| `listUnapprovedEvents({ minLat?, maxLat?, minLng?, maxLng? })` | Geographic bounds | Event[] | Events pending approval |
| `listAllClubs({ approved? })` | approved?: boolean | Club[] | All clubs with optional filter |
| `listAllChapters({ approved?, minLat?, maxLat?, minLng?, maxLng? })` | Approval + geographic | ClubChapter[] | All chapters |
| `listAllShops({ approved?, minLat?, maxLat?, minLng?, maxLng? })` | Approval + geographic | Shop[] | All shops |
| `listAllEvents({ approved?, minLat?, maxLat?, minLng?, maxLng? })` | Approval + geographic | Event[] | All events |

### Association Queries

| Resolver | Parameters | Returns | Use Case |
|----------|-----------|---------|----------|
| `listPublicClubChapters({ clubId, minLat?, maxLat?, minLng?, maxLng? })` | Club ID + geographic | ClubChapter[] | Approved chapters for a club |
| `listPublicClubAssociations({ clubId })` | clubId: string | ClubAssociation[] | Approved shop associations for club |
| `listPublicChapterAssociations({ chapterId })` | chapterId: string | ChapterAssociation[] | Approved shop associations for chapter |
| `listPublicEventAssociations({ eventId })` | eventId: string | EventChapterAssociation[] | Approved chapter associations for event |

---

## File-by-File Migration Plan

### 1. src/pages/Clubs.tsx

**Priority**: High  
**Complexity**: Medium  
**Estimated Changes**: 4 query replacements

#### Changes Needed:

1. **Fetch all clubs for filter sidebar**
   - **Line ~70**: Replace `client.models.Club.list()` → `client.queries.listPublicClubs()`
   - Remove `filter: { approved: { eq: true } }`

2. **Fetch filtered clubs with pagination**
   - **Line ~110**: Replace `client.models.Club.list()` → `client.queries.listPublicClubs()`
   - Remove manual approval filtering
   - Keep type and search filters (these are client-side)

3. **Fetch chapters with geographic bounds**
   - **Line ~220**: Replace `client.models.ClubChapter.list()` → `client.queries.listPublicChapters()`
   - Pass geographic bounds as parameters: `minLat`, `maxLat`, `minLng`, `maxLng`
   - Pass selected club IDs as `clubIds` parameter
   - Remove manual approval and geographic filtering

4. **Load more chapters pagination**
   - **Line ~280**: Same as #3 but with `nextToken`

#### Example Migration:

**Before:**
```typescript
const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];

if (selectedClubIds.size > 0) {
  const clubIdArray = Array.from(selectedClubIds);
  filters.push({ 
    or: clubIdArray.map(clubId => ({ clubId: { eq: clubId } }))
  });
}

if (mapBounds) {
  filters.push({
    latitude: { between: [mapBounds.southWest.lat, mapBounds.northEast.lat] }
  });
  filters.push({
    longitude: { between: [mapBounds.southWest.lng, mapBounds.northEast.lng] }
  });
}

const chapterFilter = filters.length > 1 ? { and: filters } : filters[0];

const response = await client.models.ClubChapter.list({
  selectionSet: ['id', 'name', 'description', ...],
  authMode,
  filter: chapterFilter,
  limit: 1000,
});
```

**After:**
```typescript
const response = await client.queries.listPublicChapters({
  clubIds: selectedClubIds.size > 0 ? Array.from(selectedClubIds) : undefined,
  minLat: mapBounds?.southWest.lat,
  maxLat: mapBounds?.northEast.lat,
  minLng: mapBounds?.southWest.lng,
  maxLng: mapBounds?.northEast.lng,
  authMode,
});
```

---

### 2. src/pages/Events.tsx

**Priority**: High  
**Complexity**: Medium  
**Estimated Changes**: 2 query replacements

#### Changes Needed:

1. **Fetch approved events**
   - **Line ~75**: Replace `client.models.Event.list()` → `client.queries.listPublicEvents()`
   - Remove `filter: { approved: { eq: true } }`

2. **Fetch user's unapproved events**
   - **Line ~90**: Replace `client.models.Event.list()` → `client.queries.listMyEvents()`
   - Remove manual owner and approval filtering
   - Pass `approved: false` parameter

#### Example Migration:

**Before:**
```typescript
const { data: approvedEvents } = await client.models.Event.list({
  selectionSet: [...],
  authMode,
  filter: { approved: { eq: true } }
});

let allEvents = approvedEvents || [];

if (authStatus === 'authenticated' && user?.userId) {
  const { data: userEvents } = await client.models.Event.list({
    selectionSet: [...],
    authMode: 'userPool',
    filter: { 
      and: [
        { approved: { eq: false } },
        { owners: { contains: user.userId } }
      ]
    }
  });
  
  if (userEvents && userEvents.length > 0) {
    allEvents = [...allEvents, ...userEvents];
  }
}
```

**After:**
```typescript
const { data: approvedEvents } = await client.queries.listPublicEvents({
  authMode,
});

let allEvents = approvedEvents || [];

if (authStatus === 'authenticated') {
  const { data: userEvents } = await client.queries.listMyEvents({
    approved: false,
    authMode: 'userPool',
  });
  
  if (userEvents && userEvents.length > 0) {
    allEvents = [...allEvents, ...userEvents];
  }
}
```

---

### 3. src/pages/Shops.tsx

**Priority**: High  
**Complexity**: Medium  
**Estimated Changes**: 3 query replacements

#### Changes Needed:

1. **Fetch clubs for filter**
   - **Line ~50**: Replace `client.models.Club.list()` → `client.queries.listPublicClubs()`
   - Remove `filter: { approved: { eq: true } }`

2. **Fetch shops with geographic bounds**
   - **Line ~70**: Replace `client.models.Shop.list()` → `client.queries.listPublicShops()`
   - Pass geographic bounds as parameters
   - Remove manual approval and geographic filtering

3. **Load more shops pagination**
   - **Line ~130**: Same as #2 but with `nextToken`

#### Example Migration:

**Before:**
```typescript
const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];

if (mapBounds) {
  filters.push({
    latitude: { between: [mapBounds.southWest.lat, mapBounds.northEast.lat] }
  });
  filters.push({
    longitude: { between: [mapBounds.southWest.lng, mapBounds.northEast.lng] }
  });
}

const shopFilter = filters.length > 1 ? { and: filters } : filters[0];

const { data: shopsData, nextToken } = await client.models.Shop.list({
  selectionSet: [...],
  authMode,
  filter: shopFilter,
  limit: 1000,
});
```

**After:**
```typescript
const { data: shopsData, nextToken } = await client.queries.listPublicShops({
  minLat: mapBounds?.southWest.lat,
  maxLat: mapBounds?.northEast.lat,
  minLng: mapBounds?.southWest.lng,
  maxLng: mapBounds?.northEast.lng,
  authMode,
});
```

---

### 4. src/pages/Profile.tsx

**Priority**: High  
**Complexity**: Low  
**Estimated Changes**: 4 query replacements

#### Changes Needed:

1. **Fetch user's clubs**
   - **Line ~90**: Replace `client.models.Club.list()` → `client.queries.listMyClubs()`
   - Remove `filter: { owners: { contains: userId } }`
   - Remove manual userId fetching

2. **Fetch user's chapters**
   - **Line ~140**: Replace `client.models.ClubChapter.list()` → `client.queries.listMyChapters()`
   - Remove owner filtering

3. **Fetch user's events**
   - **Line ~190**: Replace `client.models.Event.list()` → `client.queries.listMyEvents()`
   - Remove owner filtering
   - Keep date filtering (client-side or add to resolver if needed)

4. **Fetch user's shops**
   - **Line ~240**: Replace `client.models.Shop.list()` → `client.queries.listMyShops()`
   - Remove owner filtering

#### Example Migration:

**Before:**
```typescript
const session = await fetchAuthSession();
const userId = session.tokens?.idToken?.payload.sub as string;

if (!userId) {
  setClubsError('No user ID found');
  return;
}

const { data: clubs, errors } = await client.models.Club.list({
  filter: { owners: { contains: userId } },
  authMode: 'userPool'
});
```

**After:**
```typescript
// No need to fetch userId - resolver handles it
const { data: clubs, errors } = await client.queries.listMyClubs({
  authMode: 'userPool'
});
```

---

### 5. src/pages/Approvals.tsx

**Priority**: High  
**Complexity**: Low  
**Estimated Changes**: 4 query replacements

#### Changes Needed:

1. **Fetch unapproved clubs**
   - **Line ~70**: Replace `client.models.Club.list()` → `client.queries.listUnapprovedClubs()`
   - Remove `filter: { approved: { eq: false } }`

2. **Fetch unapproved chapters**
   - **Line ~90**: Replace `client.models.ClubChapter.list()` → `client.queries.listUnapprovedChapters()`
   - Remove approval filtering

3. **Fetch unapproved shops**
   - **Line ~110**: Replace `client.models.Shop.list()` → `client.queries.listUnapprovedShops()`
   - Remove approval filtering

4. **Fetch unapproved events**
   - **Line ~130**: Replace `client.models.Event.list()` → `client.queries.listUnapprovedEvents()`
   - Remove approval filtering

#### Example Migration:

**Before:**
```typescript
const fetchClubs = async () => {
  try {
    setLoadingClubs(true);
    const { data } = await client.models.Club.list({
      filter: { approved: { eq: false } },
      authMode: 'userPool'
    });
    
    setClubs(data.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      type: club.type,
      notes: club.notes
    })));
  } catch (error) {
    console.error('Error fetching clubs:', error);
    toast.error('Failed to load clubs');
  } finally {
    setLoadingClubs(false);
  }
};
```

**After:**
```typescript
const fetchClubs = async () => {
  try {
    setLoadingClubs(true);
    const { data } = await client.queries.listUnapprovedClubs({
      authMode: 'userPool'
    });
    
    setClubs((data || []).map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      type: club.type,
      notes: club.notes
    })));
  } catch (error) {
    console.error('Error fetching clubs:', error);
    toast.error('Failed to load clubs');
  } finally {
    setLoadingClubs(false);
  }
};
```

---

### 6. Components Using Model Access

**Priority**: Medium  
**Files to Check**:
- `src/components/forms/ShopForm.tsx` - Uses `Club.list()` for dropdown
- `src/components/forms/EventForm.tsx` - Uses `ClubChapter.list()` for dropdown
- `src/components/CreateShopModal.tsx` - May use model access
- `src/components/RegisterChapterModal.tsx` - May use model access

#### Changes Needed:

Replace any `client.models.X.list()` calls with appropriate public resolvers:
- `Club.list()` → `listPublicClubs()`
- `ClubChapter.list()` → `listPublicChapters()`

---

## Testing Checklist

### Pre-Migration Testing
- [ ] Document current behavior of each page
- [ ] Take screenshots of current state
- [ ] Note any edge cases or special behaviors

### Per-File Testing

#### Clubs.tsx
- [ ] Guest users can see approved clubs only
- [ ] Authenticated users can see approved clubs only
- [ ] Club type filter works correctly
- [ ] Club search works correctly
- [ ] Chapter map displays approved chapters only
- [ ] Geographic bounds filtering works
- [ ] Selected club filter works
- [ ] Pagination works for both clubs and chapters
- [ ] "Register a Chapter" button works for authenticated users

#### Events.tsx
- [ ] Guest users see approved events only
- [ ] Authenticated users see approved events + their unapproved events
- [ ] Unapproved events show red dot indicator
- [ ] Category filter works correctly
- [ ] Calendar displays events correctly
- [ ] Event detail modal works
- [ ] "Create Event" button works for authenticated users

#### Shops.tsx
- [ ] Guest users see approved shops only
- [ ] Authenticated users see approved shops only
- [ ] Service filter works correctly
- [ ] Club association filter works correctly
- [ ] "No Affiliation" filter works
- [ ] Geographic bounds filtering works
- [ ] Shop detail modal works
- [ ] "Add Shop" button works for authenticated users

#### Profile.tsx
- [ ] User sees all their clubs (approved + unapproved)
- [ ] User sees all their chapters (approved + unapproved)
- [ ] User sees all their events (approved + unapproved)
- [ ] User sees all their shops (approved + unapproved)
- [ ] "Under Review" badges show for unapproved items
- [ ] Click to view details works for each entity type
- [ ] Edit functionality works

#### Approvals.tsx
- [ ] Admin sees all unapproved clubs
- [ ] Admin sees all unapproved chapters
- [ ] Admin sees all unapproved shops
- [ ] Admin sees all unapproved events
- [ ] Approve button works for each entity type
- [ ] Delete button works for each entity type
- [ ] View details modal works
- [ ] Tab counts are accurate

### Post-Migration Testing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All pages load correctly
- [ ] All filters work as expected
- [ ] Pagination works correctly
- [ ] Performance is same or better
- [ ] No unapproved content visible to guests

### Security Testing
- [ ] Guest users cannot access unapproved content via API
- [ ] Authenticated users cannot access other users' unapproved content
- [ ] Non-admin users cannot access admin queries
- [ ] Direct model queries are properly restricted

---

## Common Pitfalls

### 1. Forgetting to Remove Manual Filtering

**Problem:**
```typescript
// Still has manual filtering even though using resolver
const { data } = await client.queries.listPublicClubs({
  filter: { approved: { eq: true } }, // ❌ Unnecessary - resolver handles this
  authMode: 'userPool'
});
```

**Solution:**
```typescript
// Resolver handles approval filtering
const { data } = await client.queries.listPublicClubs({
  authMode: 'userPool'
});
```

---

### 2. Not Handling Null/Undefined Results

**Problem:**
```typescript
const { data } = await client.queries.listPublicClubs();
setClubs(data); // ❌ data might be null/undefined
```

**Solution:**
```typescript
const { data } = await client.queries.listPublicClubs();
setClubs(data || []); // ✅ Provide default empty array
```

---

### 3. Using Wrong Resolver for User Context

**Problem:**
```typescript
// Authenticated user trying to see their own content
const { data } = await client.queries.listPublicClubs(); // ❌ Only shows approved
```

**Solution:**
```typescript
// Use "My" resolver to see own content (approved + unapproved)
const { data } = await client.queries.listMyClubs({
  authMode: 'userPool'
});
```

---

### 4. Not Passing Geographic Parameters

**Problem:**
```typescript
// Has map bounds but not using them
const { data } = await client.queries.listPublicChapters(); // ❌ Returns all chapters
```

**Solution:**
```typescript
// Pass geographic bounds to filter server-side
const { data } = await client.queries.listPublicChapters({
  minLat: mapBounds.southWest.lat,
  maxLat: mapBounds.northEast.lat,
  minLng: mapBounds.southWest.lng,
  maxLng: mapBounds.northEast.lng,
});
```

---

### 5. Mixing Old and New Patterns

**Problem:**
```typescript
// Using resolver for list but model for get
const { data: clubs } = await client.queries.listPublicClubs();
const { data: club } = await client.models.Club.get({ id }); // ❌ Inconsistent
```

**Solution:**
```typescript
// Use resolvers consistently
const { data: clubs } = await client.queries.listPublicClubs();
const { data: club } = await client.queries.getPublicClub({ id }); // ✅ Consistent
```

**Note**: For owner/admin operations (update, delete), continue using `client.models.X.update/delete()` as those are authorized separately.

---

### 6. Forgetting AuthMode

**Problem:**
```typescript
// Missing authMode - may cause authorization errors
const { data } = await client.queries.listPublicClubs(); // ❌ No authMode
```

**Solution:**
```typescript
// Always specify authMode
const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
const { data } = await client.queries.listPublicClubs({ authMode }); // ✅
```

---

### 7. Not Removing fetchAuthSession Calls

**Problem:**
```typescript
// Still fetching userId manually when using "My" resolvers
const session = await fetchAuthSession();
const userId = session.tokens?.idToken?.payload.sub as string;

const { data } = await client.queries.listMyClubs({ authMode: 'userPool' });
// ❌ userId fetch is unnecessary - resolver gets it automatically
```

**Solution:**
```typescript
// Resolver handles userId automatically
const { data } = await client.queries.listMyClubs({ authMode: 'userPool' });
// ✅ No need to fetch userId
```

---

## Migration Checklist

Use this checklist to track your migration progress:

### Documentation
- [x] Create migration guide
- [ ] Review migration guide with team
- [ ] Update resolver implementation summary

### Code Changes
- [ ] Migrate Clubs.tsx
- [ ] Migrate Events.tsx
- [ ] Migrate Shops.tsx
- [ ] Migrate Profile.tsx
- [ ] Migrate Approvals.tsx
- [ ] Migrate ShopForm.tsx component
- [ ] Migrate EventForm.tsx component
- [ ] Check other components for model access

### Testing
- [ ] Test Clubs.tsx (all scenarios)
- [ ] Test Events.tsx (all scenarios)
- [ ] Test Shops.tsx (all scenarios)
- [ ] Test Profile.tsx (all scenarios)
- [ ] Test Approvals.tsx (all scenarios)
- [ ] Security testing (guest access)
- [ ] Security testing (authenticated access)
- [ ] Security testing (admin access)
- [ ] Performance testing

### Deployment
- [ ] Deploy to dev environment
- [ ] Smoke test in dev
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor for errors

---

## Next Steps

1. **Review this guide** with the team to ensure everyone understands the migration approach
2. **Start with Profile.tsx** - It's the simplest migration (just 4 query replacements)
3. **Then do Approvals.tsx** - Also straightforward (4 query replacements)
4. **Move to Events.tsx** - Slightly more complex but well-documented
5. **Tackle Shops.tsx** - Similar to Events.tsx
6. **Finish with Clubs.tsx** - Most complex due to geographic filtering
7. **Update components** - Check forms and modals for any model access
8. **Test thoroughly** - Use the testing checklist above
9. **Deploy incrementally** - Test each file in dev before moving to next

---

## Support and Questions

If you encounter issues during migration:

1. **Check the resolver implementation summary** - `docs/resolver-implementation-summary.md`
2. **Review the VTL resolvers guide** - `docs/vtl-resolvers-guide.md`
3. **Check this migration guide** - Look for similar patterns
4. **Test in isolation** - Create a simple test page to verify resolver behavior
5. **Check CloudWatch logs** - Resolver errors are logged there

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-16 | 1.0 | Initial migration guide created |

---

**Status**: ✅ Documentation Complete - Ready for Implementation  
**Next Action**: Begin migration starting with Profile.tsx
