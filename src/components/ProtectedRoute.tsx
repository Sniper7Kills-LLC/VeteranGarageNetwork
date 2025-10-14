import { useAuthenticator } from '@aws-amplify/ui-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give a brief moment for auth to initialize
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [authStatus]);

  // Show loading state while checking authentication
  if (isChecking || authStatus === 'configuring') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (authStatus !== 'authenticated') {
    return <Navigate to="/" replace />;
  }

  // Render the protected route
  return <Outlet />;
}
