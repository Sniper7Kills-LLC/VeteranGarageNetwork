import { Link } from 'react-router-dom';
import { useAuthenticator, Authenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

export default function Header() {
  const { user, signOut, authStatus } = useAuthenticator((context) => [context.user]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authStatus !== 'authenticated') {
        setIsAdmin(false);
        return;
      }

      try {
        const session = await fetchAuthSession();
        const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) || [];
        setIsAdmin(groups.includes('admin'));
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [authStatus]);

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
              {isAuthenticated && (
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Profile
                </Link>
              )}
              {isAdmin && (
                <Link to="/approvals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Approvals
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-4">
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

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="mb-6">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2">
                  <Link 
                    to="/" 
                    className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/clubs" 
                    className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Clubs
                  </Link>
                  <Link 
                    to="/shops" 
                    className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Shops
                  </Link>
                  <Link 
                    to="/projects" 
                    className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link 
                    to="/parts" 
                    className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Parts
                  </Link>
                  <Link 
                    to="/events" 
                    className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Events
                  </Link>
                  {isAuthenticated && (
                    <Link 
                      to="/profile" 
                      className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  {isAdmin && (
                    <Link 
                      to="/approvals" 
                      className="text-lg font-medium hover:text-primary hover:bg-accent transition-colors py-3 px-4 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Approvals
                    </Link>
                  )}
                  
                  <div className="border-t border-border pt-4 mt-4 px-4">
                    {isAuthenticated ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          {user?.signInDetails?.loginId || user?.username}
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => {
                          setShowAuthModal(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Login / Sign Up
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
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
