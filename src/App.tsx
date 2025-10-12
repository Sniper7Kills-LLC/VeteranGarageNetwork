import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

function App() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
