import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from './components/layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        Component: lazy(() => import('./pages/Home')),
      },
      {
        path: 'clubs',
        Component: lazy(() => import('./pages/Clubs')),
      },
      {
        path: 'shops',
        Component: lazy(() => import('./pages/Shops')),
      },
      {
        path: 'projects',
        Component: lazy(() => import('./pages/Projects')),
      },
      {
        path: 'projects/:id',
        Component: lazy(() => import('./pages/ProjectJournal')),
      },
      {
        path: 'parts',
        Component: lazy(() => import('./pages/Parts')),
      },
      {
        path: 'events',
        Component: lazy(() => import('./pages/Events')),
      },
      {
        path: 'events/flyer/:id',
        Component: lazy(() => import('./pages/EventFlyer')),
      },
      {
        path: 'events/create',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            Component: lazy(() => import('./pages/CreateEvent')),
          },
        ],
      },
      {
        path: 'events/edit/:id',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            Component: lazy(() => import('./pages/EditEvent')),
          },
        ],
      },
      {
        path: 'profile',
        Component: lazy(() => import('./pages/Profile')),
      },
      {
        path: 'approvals',
        element: <AdminRoute />,
        children: [
          {
            index: true,
            Component: lazy(() => import('./pages/Approvals')),
          },
        ],
      },
    ],
  },
]);
