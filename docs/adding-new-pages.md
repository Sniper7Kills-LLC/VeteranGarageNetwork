# Adding New Pages to VGN

This guide explains how to add new pages to the Veteran Garage Network application.

## Overview

The VGN application uses a modular routing system with:
- **React Router v6+** with `createBrowserRouter`
- **Lazy loading** for code splitting
- **Page-level layout control** (each page chooses its own layout)
- **Two layout options**: ContentOnly (full-width) or ContentWithSidebar (with right sidebar)

## File Structure

```
src/
├── pages/           # All page components
├── components/
│   └── layouts/     # Layout components
├── routes.tsx       # Route configuration
└── App.tsx          # App entry point
```

## Step-by-Step Guide

### 1. Create Your Page Component

Create a new file in `src/pages/` directory:

**Example: `src/pages/AboutPage.tsx`**

```tsx
import ContentOnly from '@/components/layouts/ContentOnly';

export default function AboutPage() {
  return (
    <ContentOnly>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">About Us</h1>
        <p className="text-lg text-muted-foreground">
          Your page content goes here...
        </p>
      </div>
    </ContentOnly>
  );
}
```

### 2. Choose Your Layout

#### Option A: Full-Width Layout (No Sidebar)

Use `ContentOnly` for pages that need full-width content:

```tsx
import ContentOnly from '@/components/layouts/ContentOnly';

export default function YourPage() {
  return (
    <ContentOnly>
      {/* Your content */}
    </ContentOnly>
  );
}
```

**Best for:**
- Landing pages
- Articles/blog posts
- Forms
- Dashboard overviews

#### Option B: Layout with Right Sidebar

Use `ContentWithSidebar` for pages that need a sidebar:

```tsx
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';

function YourSidebar() {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Sidebar Title</h3>
        {/* Sidebar content */}
      </div>
    </div>
  );
}

export default function YourPage() {
  return (
    <ContentWithSidebar sidebar={<YourSidebar />}>
      <div className="space-y-6">
        {/* Your main content */}
      </div>
    </ContentWithSidebar>
  );
}
```

**Best for:**
- List/grid views with filters
- Editing interfaces with tools
- Content with navigation
- Search results with facets

### 3. Add Route Configuration

Open `src/routes.tsx` and add your page:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from './components/layouts/MainLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopsPage = lazy(() => import('./pages/ShopsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage')); // Add this

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: 'shops',
        Component: ShopsPage,
      },
      {
        path: 'about',              // Add this
        Component: AboutPage,       // Add this
      },
    ],
  },
]);
```

### 4. Add Navigation Link (Optional)

To add a link in the header, edit `src/components/Header.tsx`:

```tsx
<Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
  About
</Link>
```

## Complete Example: Profile Page with Sidebar

**File: `src/pages/ProfilePage.tsx`**

```tsx
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';

function ProfileSidebar() {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Edit Profile
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Change Password
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ContentWithSidebar sidebar={<ProfileSidebar />}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="p-6 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">Profile Information</h3>
          <p className="text-sm text-muted-foreground">
            Your profile details...
          </p>
        </div>
      </div>
    </ContentWithSidebar>
  );
}
```

**Add to `src/routes.tsx`:**

```tsx
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// In children array:
{
  path: 'profile',
  Component: ProfilePage,
}
```

## Route Patterns

### Basic Routes
```tsx
{ path: 'about', Component: AboutPage }           // /about
{ path: 'contact', Component: ContactPage }       // /contact
```

### Nested Routes
```tsx
{ path: 'shops/:id', Component: ShopDetailPage }  // /shops/123
{ path: 'user/:userId', Component: UserPage }     // /user/456
```

### Index Routes
```tsx
{ index: true, Component: HomePage }              // /
```

## Layout Components Reference

### ContentOnly
- **Purpose**: Full-width content area
- **Props**: `children` (ReactNode)
- **Responsive**: Adds container padding and max-width

### ContentWithSidebar
- **Purpose**: Main content with right sidebar
- **Props**: 
  - `children` (ReactNode) - Main content
  - `sidebar` (ReactNode) - Sidebar content
- **Responsive**: 
  - Desktop: Two columns (main + sidebar)
  - Mobile: Stacks vertically (main on top, sidebar below)
- **Sidebar Width**: 320px (80 in Tailwind units) on desktop

## Best Practices

1. **One page per file** - Keep pages focused and maintainable
2. **Lazy load all pages** - Use `lazy()` for code splitting
3. **Page owns its layout** - Each page decides if it needs a sidebar
4. **Consistent naming** - Use `PageName.tsx` format (e.g., `AboutPage.tsx`)
5. **Semantic HTML** - Use proper heading hierarchy (h1, h2, h3)
6. **Responsive design** - Test on mobile and desktop
7. **Accessibility** - Use proper ARIA labels and semantic elements

## Common Patterns

### Loading States
Pages are automatically wrapped in Suspense with a loading fallback. No additional loading state needed.

### Error Boundaries
Add error boundaries in routes.tsx if needed:

```tsx
{
  path: 'shops',
  Component: ShopsPage,
  errorElement: <ErrorPage />,
}
```

### Protected Routes
For authenticated routes, wrap with auth check:

```tsx
{
  path: 'dashboard',
  Component: DashboardPage,
  loader: async () => {
    // Check authentication
    if (!isAuthenticated()) {
      throw redirect('/login');
    }
    return null;
  },
}
```

## Troubleshooting

### Page not loading?
- Check that the route is added to `routes.tsx`
- Verify the lazy import path is correct
- Ensure the page component is exported as default

### Layout not working?
- Verify you're importing from `@/components/layouts/`
- Check that you're wrapping content in the layout component
- Ensure MainLayout has `<Outlet />` for nested routes

### Sidebar not showing?
- Confirm you're using `ContentWithSidebar` not `ContentOnly`
- Check that you're passing the `sidebar` prop
- Verify sidebar content is not empty

## Need Help?

- Review existing pages in `src/pages/` for examples
- Check the layout components in `src/components/layouts/`
- Refer to [React Router documentation](https://reactrouter.com/)
