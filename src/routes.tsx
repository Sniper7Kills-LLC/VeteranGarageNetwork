import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from './components/layouts/MainLayout';

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
        path: 'parts',
        Component: lazy(() => import('./pages/Parts')),
      },
      {
        path: 'events',
        Component: lazy(() => import('./pages/Events')),
      },
    ],
  },
]);
