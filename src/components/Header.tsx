import { Link } from 'react-router-dom';
import { useAuthenticator, Authenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function Header() {
  const { user, signOut, authStatus } = useAuthenticator((context) => [context.user]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';

  // Close modal when user successfully authenticates
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, showAuthModal]);

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              VGN
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/clubs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Clubs
              </Link>
              <Link to="/shops" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Shops
              </Link>
              <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Projects
              </Link>
              <Link to="/parts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Parts
              </Link>
              <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Events
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user?.signInDetails?.loginId || user?.username}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Login / Sign Up
              </Button>
            )}
          </div>
        </nav>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <Authenticator />
        </DialogContent>
      </Dialog>
    </header>
  );
}
