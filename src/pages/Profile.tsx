import { useAuthenticator } from '@aws-amplify/ui-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const client = generateClient<Schema>();

type Club = Schema['Club']['type'];
type ClubChapter = Schema['ClubChapter']['type'];

interface CombinedClubItem {
  id: string;
  name: string;
  type: 'Club' | 'Chapter';
  description?: string | null;
  approved: boolean;
  memberCount?: number;
  chapterCount?: number;
  parentClubName?: string;
}

const mockOwnedProjects = [
  {
    id: '1',
    name: '1969 Mustang Restoration',
    description: 'Complete frame-off restoration of a classic Mustang',
    status: 'In Progress',
    progress: 65,
  },
  {
    id: '2',
    name: 'Custom Harley Build',
    description: 'Building a custom bobber from the ground up',
    status: 'Planning',
    progress: 15,
  },
  {
    id: '3',
    name: 'Jeep Off-Road Build',
    description: 'Upgrading suspension and armor for trail riding',
    status: 'Completed',
    progress: 100,
  },
];

const mockOwnedEvents = [
  {
    id: '1',
    name: 'Monthly Garage Meetup',
    date: '2025-11-15',
    location: 'San Diego, CA',
    attendees: 23,
  },
  {
    id: '2',
    name: 'Veterans Day Ride',
    date: '2025-11-11',
    location: 'Multiple Locations',
    attendees: 156,
  },
];

const mockOwnedShops = [
  {
    id: '1',
    name: 'Veterans Auto Repair',
    description: 'Full-service automotive repair shop',
    location: 'San Diego, CA',
    services: ['Repair', 'Maintenance', 'Custom Work'],
  },
  {
    id: '2',
    name: 'Custom Cycle Works',
    description: 'Motorcycle customization and fabrication',
    location: 'Los Angeles, CA',
    services: ['Custom Builds', 'Fabrication', 'Paint'],
  },
];

export default function Profile() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [searchParams] = useSearchParams();
  const [ownedClubs, setOwnedClubs] = useState<CombinedClubItem[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ userId?: string; authStatus: string }>({ authStatus: 'unknown' });

  const isAuthenticated = authStatus === 'authenticated';

  // Fetch user's owned clubs and chapters
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingClubs(false);
      setDebugInfo({ authStatus: 'unauthenticated' });
      return;
    }

    const fetchOwnedClubsAndChapters = async () => {
      try {
        setIsLoadingClubs(true);
        setClubsError(null);
        
        // Get current user's identity
        // NOTE: Using 'sub' from the ID token, which is the Cognito User Pool subject
        // This matches what Amplify's allow.owner() authorization uses
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload.sub as string;

        // Update debug info
        setDebugInfo({
          userId: userId || 'No user ID found',
          authStatus: authStatus || 'unknown'
        });

        if (!userId) {
          const errorMsg = 'No user ID (sub) found in session';
          console.error(errorMsg);
          setClubsError(errorMsg);
          setIsLoadingClubs(false);
          return;
        }

        // Fetch clubs owned by user
        // NOTE: Using 'contains' filter to check if userId is in the owners array
        // This supports multiple owners per club
        const { data: clubs, errors: clubErrors } = await client.models.Club.list({
          filter: { owners: { contains: userId } }
        });

        if (clubErrors && clubErrors.length > 0) {
          console.error('Errors fetching clubs:', clubErrors);
          setClubsError(`Error fetching clubs: ${clubErrors[0].message}`);
        }

        // Fetch chapters owned by user
        // NOTE: Using 'contains' filter to check if userId is in the owners array
        // This supports multiple owners per chapter
        const { data: chapters, errors: chapterErrors } = await client.models.ClubChapter.list({
          filter: { owners: { contains: userId } }
        });

        if (chapterErrors && chapterErrors.length > 0) {
          console.error('Errors fetching chapters:', chapterErrors);
          setClubsError(`Error fetching chapters: ${chapterErrors[0].message}`);
        }

        // Combine and format the data
        const combinedClubs: CombinedClubItem[] = [
          // Add clubs first
          ...(clubs || []).map((club) => ({
            id: club.id,
            name: club.name,
            type: 'Club' as const,
            description: club.description,
            approved: club.approved || false,
            chapterCount: 0, // TODO: Could fetch chapter count if needed
          })),
          // Then add chapters
          ...(chapters || []).map((chapter) => ({
            id: chapter.id,
            name: chapter.name,
            type: 'Chapter' as const,
            description: chapter.description,
            approved: chapter.approved || false,
            parentClubName: undefined, // TODO: Could fetch parent club name if needed
          })),
        ];

        setOwnedClubs(combinedClubs);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching owned clubs and chapters:', error);
        setClubsError(errorMsg);
      } finally {
        setIsLoadingClubs(false);
      }
    };

    fetchOwnedClubsAndChapters();
  }, [isAuthenticated, authStatus]);

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
                <p><strong>Clubs Loaded:</strong> {ownedClubs.length}</p>
                {clubsError && (
                  <p className="text-destructive"><strong>Error:</strong> {clubsError}</p>
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
          {/* Clubs/Chapters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Clubs & Chapters</CardTitle>
                  <CardDescription>
                    Organizations you own or manage
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
              ) : ownedClubs.length > 0 ? (
                <>
                  {ownedClubs.map((club) => (
                    <div
                      key={club.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{club.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {club.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {club.type}
                            </span>
                            {!club.approved && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                                Under Review
                              </span>
                            )}
                            {club.type === 'Club' && club.chapterCount !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {club.chapterCount} chapters
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/clubs">
                    <Button variant="outline" className="w-full mt-2">
                      View All Clubs
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't own any clubs or chapters yet
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

          {/* Projects Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Your active and completed builds</CardDescription>
                </div>
                <Link to="/projects">
                  <Button size="sm" variant="outline">
                    + New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockOwnedProjects.length > 0 ? (
                <>
                  {mockOwnedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{project.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {project.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {project.progress}% complete
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/projects">
                    <Button variant="outline" className="w-full mt-2">
                      View All Projects
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't created any projects yet
                  </p>
                  <Link to="/projects">
                    <Button variant="outline" size="sm">
                      Start a Project
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
              {mockOwnedEvents.length > 0 ? (
                <>
                  {mockOwnedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{event.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.location}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {event.attendees} attendees
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/events">
                    <Button variant="outline" className="w-full mt-2">
                      View All Events
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    You're not organizing any events yet
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
              {mockOwnedShops.length > 0 ? (
                <>
                  {mockOwnedShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{shop.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {shop.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              📍 {shop.location}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {shop.services.map((service, index) => (
                              <span
                                key={index}
                                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
      </div>
    </ContentOnly>
  );
}
