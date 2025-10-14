# FORM REFACTORING PLAN - COMPLETE IMPLEMENTATION GUIDE

## Overview
This document outlines the complete refactoring strategy to achieve reusability across all form components in the VGN application. The goal is to eliminate code duplication by creating shared form components that handle both creation and editing of entities.

---

## PHASE 1: EVENTS REFACTORING

### Files to Reference:
- `src/pages/CreateEvent.tsx` (current create implementation)
- `src/pages/EditEvent.tsx` (stub to be implemented)
- `src/components/EventModal.tsx` (view modal)
- `src/components/RouteBuilder.tsx` (route planning component)
- `src/components/LocationPickerMap.tsx` (location picker)
- `src/components/ChapterAssociationSelector.tsx` (chapter associations)
- `amplify/config/enums.ts` (EVENT_CATEGORY_VALUES)

### Step 1.1: Create EventForm Component
**File to create:** `src/components/forms/EventForm.tsx`

**Requirements:**
- Accept props: `mode: 'create' | 'edit'`, `initialData?: EventData`, `onSubmit: (data) => Promise<void>`, `onCancel: () => void`
- Extract all form fields from CreateEvent.tsx
- Extract all validation logic
- Handle conditional time fields based on category (Ride vs other)
- Include LocationPickerMap integration
- Include RouteBuilder integration (for Ride events)
- Include image upload functionality
- Include ChapterAssociationSelector integration
- Manage all form state internally
- Return loading/error states to parent

**Key Features to Extract:**
- Title, description, date fields
- Category selection with conditional time fields (registration/kickstands for Ride, start/end for others)
- Address, city, state, zipCode fields
- Latitude/longitude with map picker
- Route points (for Ride category)
- Image upload with preview
- Chapter associations
- Form validation with error display
- Time formatting utilities (formatTimeTo12Hour, formatTimeForStorage)

### Step 1.2: Refactor CreateEvent Page
**File to modify:** `src/pages/CreateEvent.tsx`

**Requirements:**
- Import and use EventForm component
- Pass mode='create'
- Handle onSubmit to create event via Amplify
- Handle navigation after success
- Maintain page layout (ContentOnly wrapper, header, back button)
- Keep authentication check
- Reduce file from ~700 lines to ~150 lines

### Step 1.3: Implement EditEvent Page
**File to modify:** `src/pages/EditEvent.tsx`

**Requirements:**
- Fetch event data by ID from URL params
- Import and use EventForm component
- Pass mode='edit' and initialData
- Handle onSubmit to update event via Amplify
- Parse existing time strings back into form fields
- Handle navigation after success
- Add loading state while fetching
- Add error state if event not found or unauthorized
- Maintain page layout consistency with CreateEvent

### Step 1.4: Update Profile Page Event Handling
**File to modify:** `src/pages/Profile.tsx`

**Requirements:**
- Update event click handler to navigate to `/events/edit/:id` instead of opening modal
- Remove EventModal usage for owner view
- Keep EventModal for non-owner view (if applicable)

---

## PHASE 2: CLUBS REFACTORING

### Files to Reference:
- `src/components/CreateClubModal.tsx` (current create implementation)
- `src/components/ClubModal.tsx` (current view/edit modal)
- `amplify/config/enums.ts` (CLUB_TYPE_VALUES, CLUB_TYPE_DESCRIPTIONS)

### Step 2.1: Create ClubForm Component
**File to create:** `src/components/forms/ClubForm.tsx`

**Requirements:**
- Accept props: `mode: 'create' | 'edit'`, `initialData?: ClubData`, `onSubmit: (data) => Promise<void>`, `onCancel: () => void`
- Extract form fields: name, description, website, type, notes (for create mode only)
- Extract validation logic
- Handle club type selection with descriptions
- Manage form state internally
- Return loading/error states

**Key Features to Extract:**
- Club name (required)
- Club description (optional)
- Club website (optional)
- Club type selection with formatted labels
- Admin notes field (create mode only)
- Form validation
- Error handling and display

### Step 2.2: Refactor CreateClubModal
**File to modify:** `src/components/CreateClubModal.tsx`

**Requirements:**
- Import and use ClubForm component
- Pass mode='create'
- Handle onSubmit to create club via Amplify
- Maintain modal wrapper (Dialog component)
- Handle success callback to parent
- Reduce complexity by delegating form logic

### Step 2.3: Refactor ClubModal
**File to modify:** `src/components/ClubModal.tsx`

**Requirements:**
- Remove inline edit mode state management
- Import and use ClubForm component when in edit mode
- Pass mode='edit' and initialData
- Handle onSubmit to update club via Amplify
- Keep view mode display
- Toggle between view and edit modes
- Maintain "Manage Chapters" button functionality

---

## PHASE 3: CHAPTERS REFACTORING

### Files to Reference:
- `src/components/RegisterChapterModal.tsx` (current create implementation)
- `src/components/ChapterModal.tsx` (current view modal)
- `src/components/LocationPickerMap.tsx` (location picker)
- `src/components/ui/phone-input.tsx` (phone input component)

### Step 3.1: Create ChapterForm Component
**File to create:** `src/components/forms/ChapterForm.tsx`

**Requirements:**
- Accept props: `mode: 'create' | 'edit'`, `initialData?: ChapterData`, `onSubmit: (data) => Promise<void>`, `onCancel: () => void`, `clubId?: string` (for edit mode)
- Extract all form fields from RegisterChapterModal
- Include club selection (create mode only)
- Include LocationPickerMap integration
- Include dynamic roles array management
- Extract validation logic
- Manage form state internally

**Key Features to Extract:**
- Club selection/creation (create mode only)
- Chapter name, description, website
- Address, city, state, zipCode
- Latitude/longitude with map picker
- Dynamic chapter roles array (roleTitle, personName, email, phone)
- Admin notes (create mode only)
- Form validation including email regex
- Phone number validation (E.164 format)

### Step 3.2: Refactor RegisterChapterModal
**File to modify:** `src/components/RegisterChapterModal.tsx`

**Requirements:**
- Import and use ChapterForm component
- Pass mode='create'
- Handle onSubmit to create chapter and roles via Amplify
- Maintain modal wrapper
- Keep CreateClubModal integration
- Handle success callback
- Reduce file from ~600+ lines to ~200 lines

### Step 3.3: Refactor ChapterModal
**File to modify:** `src/components/ChapterModal.tsx`

**Requirements:**
- Add edit mode capability
- Import and use ChapterForm component when editing
- Pass mode='edit' and initialData
- Handle onSubmit to update chapter and roles via Amplify
- Keep view mode display
- Toggle between view and edit modes
- Maintain existing role display in view mode

---

## PHASE 4: SHOPS REFACTORING

### Files to Reference:
- `src/components/CreateShopModal.tsx` (current create implementation)
- `src/components/ShopModal.tsx` (current view modal)
- `src/components/LocationPickerMap.tsx` (location picker)
- `src/components/ClubAssociationSelector.tsx` (club associations)
- `src/components/ui/phone-input.tsx` (phone input)
- `amplify/config/enums.ts` (SHOP_SERVICE_VALUES)

### Step 4.1: Create ShopForm Component
**File to create:** `src/components/forms/ShopForm.tsx`

**Requirements:**
- Accept props: `mode: 'create' | 'edit'`, `initialData?: ShopData`, `onSubmit: (data) => Promise<void>`, `onCancel: () => void`
- Extract all form fields from CreateShopModal
- Include LocationPickerMap integration
- Include multi-select for services
- Include ClubAssociationSelector integration
- Extract validation logic
- Manage form state internally

**Key Features to Extract:**
- Shop name, description, website
- Address, city, state, zipCode
- Latitude/longitude with map picker
- Phone, email
- Services multi-select
- Club associations with relationship types
- Admin notes (create mode only)
- Form validation

### Step 4.2: Refactor CreateShopModal
**File to modify:** `src/components/CreateShopModal.tsx`

**Requirements:**
- Import and use ShopForm component
- Pass mode='create'
- Handle onSubmit to create shop and associations via Amplify
- Maintain modal wrapper
- Handle success callback
- Reduce complexity

### Step 4.3: Refactor ShopModal
**File to modify:** `src/components/ShopModal.tsx`

**Requirements:**
- Add edit mode capability
- Import and use ShopForm component when editing
- Pass mode='edit' and initialData
- Handle onSubmit to update shop and associations via Amplify
- Keep view mode display
- Toggle between view and edit modes

---

## SHARED UTILITIES TO CREATE

### File to create: `src/lib/form-utils.ts`

**Utilities to include:**
- `formatTimeTo12Hour(time24: string): string` - Convert 24h to 12h format
- `formatTimeForStorage(category, times): string` - Format time for database
- `parseTimeFromStorage(timeString: string, category: string)` - Parse stored time back to form fields
- `validateEmail(email: string): boolean` - Email validation
- `validatePhone(phone: string): boolean` - Phone validation
- Common validation error messages

---

## TESTING CHECKLIST

After each phase, verify:
- [ ] Create functionality works (new entities can be created)
- [ ] Edit functionality works (existing entities can be updated)
- [ ] Form validation works correctly
- [ ] Error messages display properly
- [ ] Loading states work
- [ ] Navigation works correctly
- [ ] Data persists correctly in database
- [ ] No console errors
- [ ] UI/UX is consistent between create and edit modes

---

## BENEFITS SUMMARY

**Code Reduction:**
- Events: ~700 lines → ~150 lines per page + ~400 line shared form = 50% reduction
- Clubs: ~200 lines → ~100 lines per modal + ~150 line shared form = 40% reduction
- Chapters: ~600 lines → ~200 lines per modal + ~350 line shared form = 45% reduction
- Shops: Similar to chapters

**Maintenance Benefits:**
- Single source of truth for validation
- Consistent UX across create/edit
- Easier to add new fields
- Easier to fix bugs
- Better testability

---

## IMPLEMENTATION ORDER RATIONALE

1. **Events First**: EditEvent is currently non-functional, making this the highest priority
2. **Clubs Second**: Simpler form, good learning case
3. **Chapters Third**: More complex with roles array
4. **Shops Last**: Similar to chapters, can reuse patterns

---

## PROGRESS TRACKING

### Phase 1: Events ✅ COMPLETED
- [x] Step 1.1: Create EventForm component
- [x] Step 1.2: Refactor CreateEvent.tsx
- [x] Step 1.3: Implement EditEvent.tsx
- [x] Step 1.4: Update Profile.tsx event handling

### Phase 2: Clubs ✅ COMPLETED
- [x] Step 2.1: Create ClubForm component
- [x] Step 2.2: Refactor CreateClubModal.tsx
- [x] Step 2.3: Refactor ClubModal.tsx

### Phase 3: Chapters ✅ COMPLETED
- [x] Step 3.1: Create ChapterForm component
- [x] Step 3.2: Refactor RegisterChapterModal.tsx
- [x] Step 3.3: Refactor ChapterModal.tsx (Edit capability added)

### Phase 4: Shops ✅ COMPLETED
- [x] Step 4.1: Create ShopForm component
- [x] Step 4.2: Refactor CreateShopModal.tsx
- [x] Step 4.3: Refactor ShopModal.tsx

### Shared Utilities ✅ COMPLETED
- [x] Create form-utils.ts

---

This plan serves as the complete reference throughout the refactoring process. Update the progress tracking section as each step is completed.
