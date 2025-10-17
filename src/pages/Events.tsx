import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';
import DayEventsModal from '@/components/DayEventsModal';
import EventCategoryFilter from '@/components/filters/EventCategoryFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * AWS Amplify Start
 */
// Imports
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";

/**
 * AWS Amplify End
 */

// Import event categories from centralized config
import { EVENT_CATEGORY_VALUES, EVENT_CATEGORY_DESCRIPTIONS } from '@/../amplify/config/enums';

interface RoutePoint {
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  order: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  images?: string[];
  lat: number;
  lng: number;
  route?: [number, number][]; // Array of [lat, lng] coordinates for ride routes
  routePoints?: RoutePoint[]; // Full route point data with types and descriptions
  approved?: boolean; // Track approval status
}

function EventsSidebar({ 
  selectedCategories, 
  onCategoryToggle,
  isAuthenticated,
  onCreateClick
}: { 
  selectedCategories: Set<string>; 
  onCategoryToggle: (category: string) => void;
  isAuthenticated: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <Button onClick={onCreateClick} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      )}
      
      <EventCategoryFilter
        categories={EVENT_CATEGORY_VALUES}
        selectedCategories={selectedCategories}
        onCategoryToggle={onCategoryToggle}
        categoryDescriptions={EVENT_CATEGORY_DESCRIPTIONS}
      />
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { authStatus, user } = useAuthenticator((context) => [context.authStatus, context.user]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(EVENT_CATEGORY_VALUES));
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [viewAllDate, setViewAllDate] = useState<Date | null>(null);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';

  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        // Fetch approved events (visible to everyone)
        const { data: approvedEvents } = await client.queries.listPublicEvents(
          {},
          { authMode }
        );
        
        let allEvents = approvedEvents || [];
        
        // For authenticated users, also fetch their unapproved events
        if (authStatus === 'authenticated') {
          try {
            const { data: userEvents } = await client.queries.listMyEvents(
              { approved: false },
              { authMode: 'userPool' }
            );
            
            // Merge user's unapproved events with approved events
            if (userEvents && userEvents.length > 0) {
              allEvents = [...allEvents, ...userEvents];
            }
          } catch (error) {
            console.error('Error fetching user events:', error);
            // Continue with just approved events if user events fetch fails
          }
        }
        
        // Transform events to match the Event interface
        const transformedEvents: Event[] = allEvents
          .filter((event): event is NonNullable<typeof event> => event !== null)
          .map(event => {
          // Build location string
          const locationParts = [event.address, event.city, event.state].filter(Boolean);
          const location = locationParts.join(', ') || 'Location TBD';
          
          // Transform route data if present
          let route: [number, number][] | undefined;
          let routePoints: RoutePoint[] | undefined;
          if (event.route && Array.isArray(event.route)) {
            const sortedRoute = event.route
              .filter((point): point is NonNullable<typeof point> => point !== null)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            route = sortedRoute.map(point => [point.latitude, point.longitude] as [number, number]);
            
            routePoints = sortedRoute.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
              type: point.type || 'Waypoint',
              description: point.description || '',
              order: point.order || 0,
            }));
          }
          
          return {
            id: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
            location,
            description: event.description,
            category: event.category || 'Meetup',
            images: event.images?.filter((img): img is string => img !== null) || undefined,
            lat: event.latitude,
            lng: event.longitude,
            route,
            routePoints,
            approved: event.approved ?? true,
          };
        });
        
        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [authStatus, user?.userId]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Filter events by selected categories
  const filteredEvents = useMemo(() => {
    if (selectedCategories.size === 0) {
      return [];
    }
    if (selectedCategories.size === EVENT_CATEGORY_VALUES.length) {
      return events;
    }
    return events.filter(event => selectedCategories.has(event.category));
  }, [events, selectedCategories]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleViewAllClick = (date: Date) => {
    setViewAllDate(date);
    setIsDayEventsModalOpen(true);
  };

  const handleCloseDayEventsModal = () => {
    setIsDayEventsModalOpen(false);
    setViewAllDate(null);
  };

  // Get events for the "view all" modal
  const getEventsForDate = (date: Date | null): Event[] => {
    if (!date) return [];
    
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return filteredEvents.filter(event => event.date === dateStr);
  };

  return (
    <>
      <ContentWithSidebar 
        sidebar={
          <EventsSidebar 
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            isAuthenticated={isAuthenticated}
            onCreateClick={() => navigate('/events/create')}
          />
        }
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Find an Event</h1>
            <p className="text-muted-foreground">
              Find events to get out of the house. Go for a ride, make a new friend.
            </p>
            {isAuthenticated && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                <span>Red dot indicates unapproved events (visible only to you)</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading events...
            </div>
          ) : (
            <>
              {/* Calendar with events displayed in each day */}
              <Calendar
                selectedDate={selectedDate}
                onMonthChange={setSelectedDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onViewAllClick={handleViewAllClick}
                selectedCategory={selectedCategories.size === EVENT_CATEGORY_VALUES.length ? 'All Events' : ''}
              />
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </ContentWithSidebar>

      {/* Event Detail Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
      />

      {/* Day Events Modal (for "view all" on days with many events) */}
      <DayEventsModal
        date={viewAllDate}
        events={getEventsForDate(viewAllDate)}
        isOpen={isDayEventsModalOpen}
        onClose={handleCloseDayEventsModal}
        onEventClick={handleEventClick}
      />
    </>
  );
}
