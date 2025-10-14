import { useAuthenticator } from '@aws-amplify/ui-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function AdminRoute() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authStatus !== 'authenticated') {
        setIsChecking(false);
        return;
      }

      try {
        const session = await fetchAuthSession();
        const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) || [];
        setIsAdmin(groups.includes('admin'));
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [authStatus]);

  // Show loading state while checking authentication and admin status
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

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render the protected route
  return <Outlet />;
}
