import { useAuthenticator } from '@aws-amplify/ui-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClubModal from '@/components/ClubModal';
import ChapterModal from '@/components/ChapterModal';
import ShopModal from '@/components/ShopModal';

const client = generateClient<Schema>();

interface OwnedClub {
  id: string;
  name: string;
  description?: string | null;
  approved: boolean;
  type?: string | null;
}

interface OwnedChapter {
  id: string;
  name: string;
  description?: string | null;
  approved: boolean;
  city?: string | null;
  state?: string | null;
}

interface OwnedEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  approved: boolean;
}

interface OwnedShop {
  id: string;
  name: string;
  description?: string | null;
  location: string;
  services: string[];
  approved: boolean;
}

export default function Profile() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ownedClubs, setOwnedClubs] = useState<OwnedClub[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);
  
  const [ownedChapters, setOwnedChapters] = useState<OwnedChapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  
  const [ownedEvents, setOwnedEvents] = useState<OwnedEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  const [ownedShops, setOwnedShops] = useState<OwnedShop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [shopsError, setShopsError] = useState<string | null>(null);
  
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ 
    userId?: string; 
    authStatus: string;
    clubsCount: number;
    chaptersCount: number;
    eventsCount: number;
    shopsCount: number;
  }>({ authStatus: 'unknown', clubsCount: 0, chaptersCount: 0, eventsCount: 0, shopsCount: 0 });

  // Modal states
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubModalOpen, setClubModalOpen] = useState(false);

  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);

  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [shopModalOpen, setShopModalOpen] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';

  // Fetch user's owned clubs
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingClubs(false);
      setDebugInfo({ authStatus: 'unauthenticated', clubsCount: 0, chaptersCount: 0, eventsCount: 0, shopsCount: 0 });
      return;
    }

    const fetchOwnedClubs = async () => {
      try {
        setIsLoadingClubs(true);
        setClubsError(null);
        
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload.sub as string;

        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          userId: userId || 'No user ID found',
          authStatus: authStatus || 'unknown'
        }));

        if (!userId) {
          const errorMsg = 'No user ID (sub) found in session';
          console.error(errorMsg);
          setClubsError(errorMsg);
          setIsLoadingClubs(false);
          return;
        }

        // Fetch clubs owned by user
        const { data: clubs, errors: clubErrors } = await client.models.Club.list({
          filter: { owners: { contains: userId } },
          authMode: 'userPool'
        });

        if (clubErrors && clubErrors.length > 0) {
          console.error('Errors fetching clubs:', clubErrors);
          setClubsError(`Error fetching clubs: ${clubErrors[0].message}`);
        }

        // Transform clubs
        const transformedClubs: OwnedClub[] = (clubs || []).map((club) => ({
          id: club.id,
          name: club.name,
          description: club.description,
          approved: club.approved || false,
          type: club.type,
        }));

        setOwnedClubs(transformedClubs);
        
        // Update debug info with clubs count
        setDebugInfo(prev => ({
          ...prev,
          clubsCount: transformedClubs.length
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching owned clubs:', error);
        setClubsError(errorMsg);
      } finally {
        setIsLoadingClubs(false);
      }
    };

    fetchOwnedClubs();
  }, [isAuthenticated, authStatus]);

  // Fetch user's owned chapters
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingChapters(false);
      return;
    }

    const fetchOwnedChapters = async () => {
      try {
        setIsLoadingChapters(true);
        setChaptersError(null);
        
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload.sub as string;

        if (!userId) {
          const errorMsg = 'No user ID (sub) found in session';
          console.error(errorMsg);
          setChaptersError(errorMsg);
          setIsLoadingChapters(false);
          return;
        }

        // Fetch chapters owned by user
        const { data: chapters, errors: chapterErrors } = await client.models.ClubChapter.list({
          filter: { owners: { contains: userId } },
          authMode: 'userPool'
        });

        if (chapterErrors && chapterErrors.length > 0) {
          console.error('Errors fetching chapters:', chapterErrors);
          setChaptersError(`Error fetching chapters: ${chapterErrors[0].message}`);
        }

        // Transform chapters
        const transformedChapters: OwnedChapter[] = (chapters || []).map((chapter) => ({
          id: chapter.id,
          name: chapter.name,
          description: chapter.description,
          approved: chapter.approved || false,
          city: chapter.city,
          state: chapter.state,
        }));

        setOwnedChapters(transformedChapters);
        
        // Update debug info with chapters count
        setDebugInfo(prev => ({
          ...prev,
          chaptersCount: transformedChapters.length
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching owned chapters:', error);
        setChaptersError(errorMsg);
      } finally {
        setIsLoadingChapters(false);
      }
    };

    fetchOwnedChapters();
  }, [isAuthenticated, authStatus]);

  // Fetch user's owned events (future events only)
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingEvents(false);
      return;
    }

    const fetchOwnedEvents = async () => {
      try {
        setIsLoadingEvents(true);
        setEventsError(null);
        
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload.sub as string;

        if (!userId) {
          const errorMsg = 'No user ID (sub) found in session';
          console.error(errorMsg);
          setEventsError(errorMsg);
          setIsLoadingEvents(false);
          return;
        }

        // Get current date in YYYY-MM-DD format for filtering
        const today = new Date().toISOString().split('T')[0];

        // Fetch events owned by user that are in the future
        const { data: events, errors: eventErrors } = await client.models.Event.list({
          filter: { 
            and: [
              { owners: { contains: userId } },
              { date: { ge: today } }
            ]
          },
          authMode: 'userPool'
        });

        if (eventErrors && eventErrors.length > 0) {
          console.error('Errors fetching events:', eventErrors);
          setEventsError(`Error fetching events: ${eventErrors[0].message}`);
        }

        // Transform events to match the OwnedEvent interface
        const transformedEvents: OwnedEvent[] = (events || []).map((event) => {
          const locationParts = [event.city, event.state].filter(Boolean);
          const location = locationParts.join(', ') || 'Location TBD';
          
          return {
            id: event.id,
            title: event.title,
            date: event.date,
            location,
            category: event.category || 'Meetup',
            approved: event.approved || false,
          };
        });

        setOwnedEvents(transformedEvents);
        
        // Update debug info with events count
        setDebugInfo(prev => ({
          ...prev,
          eventsCount: transformedEvents.length
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching owned events:', error);
        setEventsError(errorMsg);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchOwnedEvents();
  }, [isAuthenticated, authStatus]);

  // Fetch user's owned shops
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingShops(false);
      return;
    }

    const fetchOwnedShops = async () => {
      try {
        setIsLoadingShops(true);
        setShopsError(null);
        
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload.sub as string;

        if (!userId) {
          const errorMsg = 'No user ID (sub) found in session';
          console.error(errorMsg);
          setShopsError(errorMsg);
          setIsLoadingShops(false);
          return;
        }

        // Fetch shops owned by user
        const { data: shops, errors: shopErrors } = await client.models.Shop.list({
          filter: { owners: { contains: userId } },
          authMode: 'userPool'
        });

        if (shopErrors && shopErrors.length > 0) {
          console.error('Errors fetching shops:', shopErrors);
          setShopsError(`Error fetching shops: ${shopErrors[0].message}`);
        }

        // Transform shops to match the OwnedShop interface
        const transformedShops: OwnedShop[] = (shops || []).map((shop) => {
          const locationParts = [shop.city, shop.state].filter(Boolean);
          const location = locationParts.join(', ') || 'Location TBD';
          
          return {
            id: shop.id,
            name: shop.name,
            description: shop.description,
            location,
            services: shop.services?.filter((s): s is string => s !== null) || [],
            approved: shop.approved || false,
          };
        });

        setOwnedShops(transformedShops);
        
        // Update debug info with shops count
        setDebugInfo(prev => ({
          ...prev,
          shopsCount: transformedShops.length
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching owned shops:', error);
        setShopsError(errorMsg);
      } finally {
        setIsLoadingShops(false);
      }
    };

    fetchOwnedShops();
  }, [isAuthenticated, authStatus]);

  // Click handlers with lazy loading
  const handleClubClick = async (clubId: string) => {
    // Check if already loaded
    if (selectedClub?.id === clubId) {
      setClubModalOpen(true);
      return;
    }

    try {
      const { data: club } = await client.models.Club.get(
        { id: clubId },
        { authMode: 'userPool' }
      );
      
      if (club) {
        setSelectedClub(club);
        setClubModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching club:', error);
      alert('Failed to load club details');
    }
  };

  const handleChapterClick = async (chapterId: string) => {
    // Check if already loaded
    if (selectedChapter?.id === chapterId) {
      setChapterModalOpen(true);
      return;
    }

    try {
      const { data: chapter } = await client.models.ClubChapter.get(
        { id: chapterId },
        { 
          authMode: 'userPool',
          selectionSet: ['id', 'name', 'description', 'website', 'address', 'city', 'state', 'latitude', 'longitude', 'clubId', 'roles.*']
        }
      );
      
      if (chapter) {
        // Transform to match ChapterModal interface
        const transformedChapter = {
          ...chapter,
          clubName: '', // We don't have this in the summary, but modal doesn't require it
          clubType: [],
          roles: chapter.roles || []
        };
        setSelectedChapter(transformedChapter);
        setChapterModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      alert('Failed to load chapter details');
    }
  };

  const handleEventClick = (eventId: string) => {
    // Navigate to edit page
    navigate(`/events/edit/${eventId}`);
  };

  const handleShopClick = async (shopId: string) => {
    // Check if already loaded
    if (selectedShop?.id === shopId) {
      setShopModalOpen(true);
      return;
    }

    try {
      const { data: shop } = await client.models.Shop.get(
        { id: shopId },
        { 
          authMode: 'userPool',
          selectionSet: ['id', 'name', 'description', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude', 'phone', 'email', 'website', 'services', 'approved', 'clubAssociations.*']
        }
      );
      
      if (shop) {
        // Transform to match ShopModal interface
        const transformedShop = {
          ...shop,
          services: shop.services?.filter((s): s is string => s !== null) || [],
          clubAssociations: shop.clubAssociations?.map(assoc => ({
            id: assoc.id,
            clubId: assoc.clubId,
            clubName: '', // We don't fetch this, but it's optional
            relationship: assoc.relationship,
            details: assoc.details
          })) || []
        };
        setSelectedShop(transformedShop);
        setShopModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      alert('Failed to load shop details');
    }
  };

  // Refresh handlers after save
  const handleClubSave = async () => {
    setClubModalOpen(false);
    
    // Refetch the updated club data
    if (selectedClub?.id) {
      try {
        const { data: club } = await client.models.Club.get(
          { id: selectedClub.id },
          { authMode: 'userPool' }
        );
        
        if (club) {
          setSelectedClub(club);
          
          // Update the club in the owned clubs list
          setOwnedClubs(prev => 
            prev.map(c => c.id === club.id ? {
              id: club.id,
              name: club.name,
              description: club.description,
              approved: club.approved || false,
              type: club.type,
            } : c)
          );
        }
      } catch (error) {
        console.error('Error refetching club:', error);
      }
    }
  };

  const handleChapterSave = async () => {
    setChapterModalOpen(false);
    
    // Refetch the updated chapter data
    if (selectedChapter?.id) {
      try {
        const { data: chapter } = await client.models.ClubChapter.get(
          { id: selectedChapter.id },
          { 
            authMode: 'userPool',
            selectionSet: ['id', 'name', 'description', 'website', 'address', 'city', 'state', 'latitude', 'longitude', 'clubId', 'approved', 'roles.*']
          }
        );
        
        if (chapter) {
          const transformedChapter = {
            ...chapter,
            clubName: selectedChapter.clubName || '',
            clubType: selectedChapter.clubType || [],
            roles: chapter.roles || []
          };
          setSelectedChapter(transformedChapter);
          
          // Update the chapter in the owned chapters list
          setOwnedChapters(prev => 
            prev.map(c => c.id === chapter.id ? {
              id: chapter.id,
              name: chapter.name,
              description: chapter.description,
              approved: chapter.approved || false,
              city: chapter.city,
              state: chapter.state,
            } : c)
          );
        }
      } catch (error) {
        console.error('Error refetching chapter:', error);
      }
    }
  };

  const handleShopSave = async () => {
    setShopModalOpen(false);
    
    // Refetch the updated shop data
    if (selectedShop?.id) {
      try {
        const { data: shop } = await client.models.Shop.get(
          { id: selectedShop.id },
          { 
            authMode: 'userPool',
            selectionSet: ['id', 'name', 'description', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude', 'phone', 'email', 'website', 'services', 'approved', 'clubAssociations.*']
          }
        );
        
        if (shop) {
          const transformedShop = {
            ...shop,
            services: shop.services?.filter((s): s is string => s !== null) || [],
            clubAssociations: shop.clubAssociations?.map(assoc => ({
              id: assoc.id,
              clubId: assoc.clubId,
              clubName: '',
              relationship: assoc.relationship,
              details: assoc.details
            })) || []
          };
          setSelectedShop(transformedShop);
          
          // Update the shop in the owned shops list
          setOwnedShops(prev => 
            prev.map(s => s.id === shop.id ? {
              id: shop.id,
              name: shop.name,
              description: shop.description,
              location: [shop.city, shop.state].filter(Boolean).join(', ') || 'Location TBD',
              services: shop.services?.filter((s): s is string => s !== null) || [],
              approved: shop.approved || false,
            } : s)
          );
        }
      } catch (error) {
        console.error('Error refetching shop:', error);
      }
    }
  };

  // Parse OAuth error from URL parameters
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');

  // If not authenticated, show OAuth error if present
  if (!isAuthenticated) {
    return (
      <ContentOnly>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center">
                {oauthError ? 'Authentication Error' : 'Not Authenticated'}
              </CardTitle>
              <CardDescription className="text-center">
                {oauthError
                  ? 'There was a problem with your login'
                  : 'Please log in to view your profile'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {oauthError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Error: {oauthError}
                  </p>
                  {oauthErrorDescription && (
                    <p className="text-sm text-muted-foreground">
                      {decodeURIComponent(oauthErrorDescription)}
                    </p>
                  )}
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {oauthError
                    ? 'Please try logging in again or contact support if the problem persists.'
                    : 'You need to be logged in to access your profile and view your clubs, projects, and events.'}
                </p>
                <Link to="/">
                  <Button className="w-full mt-4">Return to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentOnly>
    );
  }

  // Authenticated view - show user's owned entities
  return (
    <ContentOnly>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clubs, projects, and events
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </Button>
        </div>

        {/* Debug Info Card */}
        {showDebug && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm">
                <p><strong>Auth Status:</strong> {debugInfo.authStatus}</p>
                <p><strong>User ID:</strong> {debugInfo.userId || 'Not available'}</p>
                <p><strong>Clubs:</strong> {debugInfo.clubsCount}</p>
                <p><strong>Chapters:</strong> {debugInfo.chaptersCount}</p>
                <p><strong>Events:</strong> {debugInfo.eventsCount}</p>
                <p><strong>Shops:</strong> {debugInfo.shopsCount}</p>
                {clubsError && (
                  <p className="text-destructive"><strong>Clubs Error:</strong> {clubsError}</p>
                )}
                {chaptersError && (
                  <p className="text-destructive"><strong>Chapters Error:</strong> {chaptersError}</p>
                )}
                {eventsError && (
                  <p className="text-destructive"><strong>Events Error:</strong> {eventsError}</p>
                )}
                {shopsError && (
                  <p className="text-destructive"><strong>Shops Error:</strong> {shopsError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {clubsError && !showDebug && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Error Loading Clubs & Chapters
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {clubsError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Clubs Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Clubs</CardTitle>
                  <CardDescription>
                    Clubs you own or manage
                  </CardDescription>
                </div>
                <Link to="/clubs">
                  <Button size="sm" variant="outline">
                    + New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingClubs ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : clubsError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-4">
                    Error loading clubs: {clubsError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : ownedClubs.length > 0 ? (
                <>
                  <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                    {ownedClubs.map((club) => (
                      <div
                      key={club.id}
                      onClick={() => handleClubClick(club.id)}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{club.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {club.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {club.type && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {club.type}
                              </span>
                            )}
                            {!club.approved && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                                Under Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/clubs">
                    <Button variant="outline" className="w-full mt-2">
                      View All Clubs
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't own any clubs yet
                  </p>
                  <Link to="/clubs">
                    <Button variant="outline" size="sm">
                      Explore Clubs
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chapters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Chapters</CardTitle>
                  <CardDescription>
                    Chapters you own or manage
                  </CardDescription>
                </div>
                <Link to="/clubs">
                  <Button size="sm" variant="outline">
                    + New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingChapters ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : chaptersError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-4">
                    Error loading chapters: {chaptersError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : ownedChapters.length > 0 ? (
                <>
                  <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                    {ownedChapters.map((chapter) => (
                      <div
                      key={chapter.id}
                      onClick={() => handleChapterClick(chapter.id)}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{chapter.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {chapter.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {(chapter.city || chapter.state) && (
                              <span className="text-xs text-muted-foreground">
                                📍 {[chapter.city, chapter.state].filter(Boolean).join(', ')}
                              </span>
                            )}
                            {!chapter.approved && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                                Under Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/clubs">
                    <Button variant="outline" className="w-full mt-2">
                      View All Chapters
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't own any chapters yet
                  </p>
                  <Link to="/clubs">
                    <Button variant="outline" size="sm">
                      Explore Chapters
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Events</CardTitle>
                  <CardDescription>Events you're organizing</CardDescription>
                </div>
                <Link to="/events">
                  <Button size="sm" variant="outline">
                    + New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingEvents ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : eventsError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-4">
                    Error loading events: {eventsError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : ownedEvents.length > 0 ? (
                <>
                  <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                    {ownedEvents.map((event) => (
                      <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.location}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {event.category}
                            </span>
                            {!event.approved && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                                Under Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/events">
                    <Button variant="outline" className="w-full mt-2">
                      View All Events
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You're not organizing any upcoming events
                  </p>
                  <Link to="/events">
                    <Button variant="outline" size="sm">
                      Create an Event
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shops Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Shops</CardTitle>
                  <CardDescription>Shops you own or manage</CardDescription>
                </div>
                <Link to="/shops">
                  <Button size="sm" variant="outline">
                    + New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingShops ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : shopsError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-4">
                    Error loading shops: {shopsError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : ownedShops.length > 0 ? (
                <>
                  <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                    {ownedShops.map((shop) => (
                      <div
                      key={shop.id}
                      onClick={() => handleShopClick(shop.id)}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{shop.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {shop.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              📍 {shop.location}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {shop.services.length > 0 ? (
                              shop.services.map((service, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                                >
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No services listed
                              </span>
                            )}
                            {!shop.approved && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                                Under Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/shops">
                    <Button variant="outline" className="w-full mt-2">
                      View All Shops
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't own any shops yet
                  </p>
                  <Link to="/shops">
                    <Button variant="outline" size="sm">
                      Explore Shops
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <ClubModal
          club={selectedClub}
          open={clubModalOpen}
          onOpenChange={setClubModalOpen}
          isOwner={true}
          onSave={handleClubSave}
        />

        <ChapterModal
          chapter={selectedChapter}
          open={chapterModalOpen}
          onOpenChange={setChapterModalOpen}
          isOwner={true}
          onSave={handleChapterSave}
        />

        <ShopModal
          shop={selectedShop}
          open={shopModalOpen}
          onOpenChange={setShopModalOpen}
          isOwner={true}
          onSave={handleShopSave}
        />
      </div>
    </ContentOnly>
  );
}
