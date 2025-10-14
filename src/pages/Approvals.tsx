import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ClubModal from '@/components/ClubModal';
import ChapterModal from '@/components/ChapterModal';
import ShopModal from '@/components/ShopModal';
import EventModal from '@/components/EventModal';

const client = generateClient<Schema>();

interface UnapprovedClub {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  notes?: string | null;
}

interface UnapprovedChapter {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  clubId: string;
}

interface UnapprovedShop {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  services?: (string | null)[];
  notes?: string | null;
}

interface UnapprovedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
}

type TabType = 'clubs' | 'chapters' | 'shops' | 'events';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<TabType>('clubs');
  
  // Clubs state
  const [clubs, setClubs] = useState<UnapprovedClub[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  
  // Chapters state
  const [chapters, setChapters] = useState<UnapprovedChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  
  // Shops state
  const [shops, setShops] = useState<UnapprovedShop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  
  // Events state
  const [events, setEvents] = useState<UnapprovedEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Modal states
  const [selectedClub, setSelectedClub] = useState<Record<string, unknown> | null>(null);
  const [clubModalOpen, setClubModalOpen] = useState(false);
  
  const [selectedChapter, setSelectedChapter] = useState<Record<string, unknown> | null>(null);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  
  const [selectedShop, setSelectedShop] = useState<Record<string, unknown> | null>(null);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState<Record<string, unknown> | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // Fetch unapproved clubs
  const fetchClubs = async () => {
    try {
      setLoadingClubs(true);
      const { data } = await client.models.Club.list({
        filter: { approved: { eq: false } },
        authMode: 'userPool'
      });
      
      setClubs(data.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        type: club.type,
        notes: club.notes
      })));
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    } finally {
      setLoadingClubs(false);
    }
  };

  // Fetch unapproved chapters
  const fetchChapters = async () => {
    try {
      setLoadingChapters(true);
      const { data } = await client.models.ClubChapter.list({
        filter: { approved: { eq: false } },
        authMode: 'userPool'
      });
      
      setChapters(data.map(chapter => ({
        id: chapter.id,
        name: chapter.name,
        description: chapter.description,
        city: chapter.city,
        state: chapter.state,
        notes: chapter.notes,
        clubId: chapter.clubId
      })));
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setLoadingChapters(false);
    }
  };

  // Fetch unapproved shops
  const fetchShops = async () => {
    try {
      setLoadingShops(true);
      const { data } = await client.models.Shop.list({
        filter: { approved: { eq: false } },
        authMode: 'userPool'
      });
      
      setShops(data.map(shop => ({
        id: shop.id,
        name: shop.name,
        description: shop.description,
        city: shop.city,
        state: shop.state,
        services: shop.services || undefined,
        notes: shop.notes
      })));
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoadingShops(false);
    }
  };

  // Fetch unapproved events
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data } = await client.models.Event.list({
        filter: { approved: { eq: false } },
        authMode: 'userPool'
      });
      
      setEvents(data.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        category: event.category,
        city: event.city,
        state: event.state,
        notes: event.notes
      })));
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchClubs();
    fetchChapters();
    fetchShops();
    fetchEvents();
  }, []);

  // Approve club
  const handleApproveClub = async (id: string) => {
    try {
      await client.models.Club.update({
        id,
        approved: true
      }, { authMode: 'userPool' });
      
      toast.success('Club approved successfully');
      fetchClubs();
    } catch (error) {
      console.error('Error approving club:', error);
      toast.error('Failed to approve club');
    }
  };

  // Delete club
  const handleDeleteClub = async (id: string) => {
    try {
      await client.models.Club.delete({ id }, { authMode: 'userPool' });
      toast.success('Club deleted successfully');
      fetchClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };

  // Approve chapter
  const handleApproveChapter = async (id: string) => {
    try {
      await client.models.ClubChapter.update({
        id,
        approved: true
      }, { authMode: 'userPool' });
      
      toast.success('Chapter approved successfully');
      fetchChapters();
    } catch (error) {
      console.error('Error approving chapter:', error);
      toast.error('Failed to approve chapter');
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (id: string) => {
    try {
      await client.models.ClubChapter.delete({ id }, { authMode: 'userPool' });
      toast.success('Chapter deleted successfully');
      fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  // Approve shop
  const handleApproveShop = async (id: string) => {
    try {
      await client.models.Shop.update({
        id,
        approved: true
      }, { authMode: 'userPool' });
      
      toast.success('Shop approved successfully');
      fetchShops();
    } catch (error) {
      console.error('Error approving shop:', error);
      toast.error('Failed to approve shop');
    }
  };

  // Delete shop
  const handleDeleteShop = async (id: string) => {
    try {
      await client.models.Shop.delete({ id }, { authMode: 'userPool' });
      toast.success('Shop deleted successfully');
      fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast.error('Failed to delete shop');
    }
  };

  // Approve event
  const handleApproveEvent = async (id: string) => {
    try {
      await client.models.Event.update({
        id,
        approved: true
      }, { authMode: 'userPool' });
      
      toast.success('Event approved successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Failed to approve event');
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    try {
      await client.models.Event.delete({ id }, { authMode: 'userPool' });
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  // View details handlers
  const handleViewClub = async (id: string) => {
    try {
      const { data: club } = await client.models.Club.get(
        { id },
        { authMode: 'userPool' }
      );
      
      if (club) {
        setSelectedClub(club);
        setClubModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching club:', error);
      toast.error('Failed to load club details');
    }
  };

  const handleViewChapter = async (id: string) => {
    try {
      const { data: chapter } = await client.models.ClubChapter.get(
        { id },
        { 
          authMode: 'userPool',
          selectionSet: ['id', 'name', 'description', 'website', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude', 'clubId', 'owners', 'roles.*']
        }
      );
      
      if (chapter) {
        const transformedChapter = {
          ...chapter,
          clubName: '',
          clubType: [],
          roles: chapter.roles || []
        };
        setSelectedChapter(transformedChapter);
        setChapterModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast.error('Failed to load chapter details');
    }
  };

  const handleViewShop = async (id: string) => {
    try {
      const { data: shop } = await client.models.Shop.get(
        { id },
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
        setShopModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('Failed to load shop details');
    }
  };

  const handleViewEvent = async (id: string) => {
    try {
      const { data: event } = await client.models.Event.get(
        { id },
        { authMode: 'userPool' }
      );
      
      if (event) {
        const transformedEvent = {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: [event.city, event.state].filter(Boolean).join(', ') || 'Location TBD',
          description: event.description,
          category: event.category || 'Meetup',
          images: event.images?.filter((img): img is string => img !== null) || [],
          lat: event.latitude,
          lng: event.longitude,
          route: event.route?.filter(point => point !== null).map(point => [point.latitude, point.longitude] as [number, number]) || []
        };
        setSelectedEvent(transformedEvent);
        setEventModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    }
  };

  const tabs = [
    { id: 'clubs' as TabType, label: 'Clubs', count: clubs.length },
    { id: 'chapters' as TabType, label: 'Chapters', count: chapters.length },
    { id: 'shops' as TabType, label: 'Shops', count: shops.length },
    { id: 'events' as TabType, label: 'Events', count: events.length },
  ];

  return (
    <ContentOnly>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve clubs, chapters, shops, and events
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Clubs Tab */}
          {activeTab === 'clubs' && (
            <>
              {loadingClubs ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="text-sm text-muted-foreground mt-2">Loading clubs...</p>
                </div>
              ) : clubs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No clubs pending approval</p>
                  </CardContent>
                </Card>
              ) : (
                clubs.map(club => (
                  <Card key={club.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{club.name}</CardTitle>
                          {club.type && (
                            <Badge variant="secondary" className="mt-2">
                              {club.type.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {club.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {club.description}
                          </p>
                        </div>
                      )}
                      
                      {club.notes && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Admin Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            {club.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewClub(club.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApproveClub(club.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteClub(club.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Chapters Tab */}
          {activeTab === 'chapters' && (
            <>
              {loadingChapters ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="text-sm text-muted-foreground mt-2">Loading chapters...</p>
                </div>
              ) : chapters.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No chapters pending approval</p>
                  </CardContent>
                </Card>
              ) : (
                chapters.map(chapter => (
                  <Card key={chapter.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{chapter.name}</CardTitle>
                          {(chapter.city || chapter.state) && (
                            <CardDescription className="mt-1">
                              📍 {[chapter.city, chapter.state].filter(Boolean).join(', ')}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {chapter.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {chapter.description}
                          </p>
                        </div>
                      )}
                      
                      {chapter.notes && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Admin Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            {chapter.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewChapter(chapter.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApproveChapter(chapter.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteChapter(chapter.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Shops Tab */}
          {activeTab === 'shops' && (
            <>
              {loadingShops ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="text-sm text-muted-foreground mt-2">Loading shops...</p>
                </div>
              ) : shops.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No shops pending approval</p>
                  </CardContent>
                </Card>
              ) : (
                shops.map(shop => (
                  <Card key={shop.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{shop.name}</CardTitle>
                          {(shop.city || shop.state) && (
                            <CardDescription className="mt-1">
                              📍 {[shop.city, shop.state].filter(Boolean).join(', ')}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {shop.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {shop.description}
                          </p>
                        </div>
                      )}
                      
                      {shop.services && shop.services.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Services</h4>
                          <div className="flex flex-wrap gap-1">
                            {shop.services.filter((s): s is string => s !== null).map((service, idx) => (
                              <Badge key={idx} variant="secondary">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {shop.notes && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Admin Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            {shop.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewShop(shop.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApproveShop(shop.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteShop(shop.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <>
              {loadingEvents ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="text-sm text-muted-foreground mt-2">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No events pending approval</p>
                  </CardContent>
                </Card>
              ) : (
                events.map(event => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at {event.time}
                          </CardDescription>
                          {event.category && (
                            <Badge variant="secondary" className="mt-2">
                              {event.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(event.city || event.state) && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Location</h4>
                          <p className="text-sm text-muted-foreground">
                            📍 {[event.city, event.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {event.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      )}
                      
                      {event.notes && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Admin Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewEvent(event.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApproveEvent(event.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ClubModal
        club={selectedClub as any}
        open={clubModalOpen}
        onOpenChange={setClubModalOpen}
        isOwner={false}
      />

      <ChapterModal
        chapter={selectedChapter as any}
        open={chapterModalOpen}
        onOpenChange={setChapterModalOpen}
        isOwner={false}
      />

      <ShopModal
        shop={selectedShop as any}
        open={shopModalOpen}
        onOpenChange={setShopModalOpen}
        isOwner={false}
      />

      <EventModal
        event={selectedEvent as any}
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        isOwner={false}
      />
    </ContentOnly>
  );
}
