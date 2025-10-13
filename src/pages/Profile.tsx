import { useAuthenticator } from '@aws-amplify/ui-react';
import { useSearchParams, Link } from 'react-router-dom';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data for user's owned entities
const mockOwnedClubs = [
  {
    id: '1',
    name: 'Combat Customs - San Diego',
    type: 'Chapter',
    description: 'San Diego chapter specializing in custom builds',
    memberCount: 45,
  },
  {
    id: '2',
    name: 'Veterans Garage Network',
    type: 'Club',
    description: 'Main organization connecting veteran garage enthusiasts',
    chapterCount: 12,
  },
];

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

  const isAuthenticated = authStatus === 'authenticated';

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
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your clubs, projects, and events
          </p>
        </div>

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
              {mockOwnedClubs.length > 0 ? (
                <>
                  {mockOwnedClubs.map((club) => (
                    <div
                      key={club.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{club.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {club.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {club.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {'memberCount' in club
                                ? `${club.memberCount} members`
                                : `${club.chapterCount} chapters`}
                            </span>
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
