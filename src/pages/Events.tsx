import { useState } from 'react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';
import DayEventsModal from '@/components/DayEventsModal';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  images?: string[];
}

// Static event data
const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Veterans Car Meet & Greet',
    date: '2025-10-15',
    time: '10:00 AM - 2:00 PM',
    location: 'Veterans Memorial Park, Main Street',
    description: 'Join fellow veteran car enthusiasts for a casual meet and greet. Share stories, show off your rides, and connect with the community. Coffee and donuts provided!',
    category: 'Meetup',
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop']
  },
  {
    id: '1a',
    title: 'Morning Coffee Cruise',
    date: '2025-10-15',
    time: '7:00 AM - 9:00 AM',
    location: 'Downtown Coffee Shop',
    description: 'Start your day with a casual morning cruise and coffee with fellow veterans. Bring your ride and enjoy good company!',
    category: 'Ride',
    images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&h=600&fit=crop']
  },
  {
    id: '1b',
    title: 'Engine Rebuild Workshop',
    date: '2025-10-15',
    time: '9:00 AM - 12:00 PM',
    location: 'Mike\'s Auto Shop, 789 Elm Street',
    description: 'Hands-on workshop covering engine rebuild basics. Learn from experienced mechanics and get your hands dirty!',
    category: 'Workshop',
  },
  {
    id: '1c',
    title: 'Vintage Motorcycle Show',
    date: '2025-10-15',
    time: '11:00 AM - 4:00 PM',
    location: 'City Park Pavilion',
    description: 'Showcase of vintage motorcycles from the 1940s-1980s. Free admission, awards for best bikes in various categories.',
    category: 'Show',
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop']
  },
  {
    id: '1d',
    title: 'BBQ & Burnouts',
    date: '2025-10-15',
    time: '3:00 PM - 7:00 PM',
    location: 'Veteran\'s Speedway',
    description: 'Afternoon of BBQ, burnouts, and good times. Bring your muscle car and show us what it can do! Food provided.',
    category: 'Meetup',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop']
  },
  {
    id: '1e',
    title: 'Sunset Cruise to the Coast',
    date: '2025-10-15',
    time: '5:00 PM - 8:00 PM',
    location: 'Meeting at Highway 1 Overlook',
    description: 'Beautiful sunset cruise along the coastal highway. We\'ll stop at scenic points and end with dinner at a beachside restaurant.',
    category: 'Ride',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop']
  },
  {
    id: '1f',
    title: 'Night Photography Session',
    date: '2025-10-15',
    time: '7:00 PM - 10:00 PM',
    location: 'Industrial District',
    description: 'Learn automotive night photography techniques. Bring your camera and your ride for an evening photo shoot.',
    category: 'Meetup',
  },
  {
    id: '2',
    title: 'Scenic Mountain Drive',
    date: '2025-10-20',
    time: '8:00 AM - 4:00 PM',
    location: 'Starting at Highway 101 Rest Stop',
    description: 'A beautiful scenic drive through the mountains. We\'ll take the backroads and stop for lunch at a local diner. All vehicle types welcome!',
    category: 'Ride',
    images: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop']
  },
  {
    id: '3',
    title: 'Classic Car Show',
    date: '2025-10-25',
    time: '9:00 AM - 5:00 PM',
    location: 'County Fairgrounds',
    description: 'Annual classic car show featuring vehicles from the 1920s to 1980s. Awards for best in show, people\'s choice, and more. Food trucks and live music all day.',
    category: 'Show',
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop']
  },
  {
    id: '4',
    title: 'Wrench Night - Basic Maintenance',
    date: '2025-10-18',
    time: '6:00 PM - 9:00 PM',
    location: 'Joe\'s Garage, 456 Oak Avenue',
    description: 'Learn basic car maintenance skills! This month we\'re covering oil changes, tire rotation, and brake inspection. Bring your questions and tools.',
    category: 'Workshop',
  },
  {
    id: '5',
    title: 'Veterans Day Parade',
    date: '2025-11-11',
    time: '10:00 AM - 12:00 PM',
    location: 'Downtown Main Street',
    description: 'Join us in the annual Veterans Day parade. Classic cars and motorcycles welcome. Let\'s show our pride and honor our service together.',
    category: 'Parade',
    images: ['https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=600&fit=crop']
  },
  {
    id: '6',
    title: 'Coastal Cruise',
    date: '2025-11-05',
    time: '9:00 AM - 3:00 PM',
    location: 'Beach Parking Lot A',
    description: 'Cruise along the beautiful coastal highway. We\'ll stop at scenic overlooks and have lunch at a beachside restaurant. Perfect weather expected!',
    category: 'Ride',
  },
  {
    id: '7',
    title: 'Monthly Coffee & Cars',
    date: '2025-11-02',
    time: '8:00 AM - 11:00 AM',
    location: 'Veterans Center Parking Lot',
    description: 'Our monthly casual gathering. Bring your car, truck, or motorcycle and enjoy coffee with fellow veterans. No registration required, just show up!',
    category: 'Meetup',
  },
];

const CATEGORIES = ['All Events', 'Meetup', 'Ride', 'Show', 'Workshop', 'Parade'];

function EventsSidebar({ selectedCategory, onCategoryChange }: { 
  selectedCategory: string; 
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('All Events');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [viewAllDate, setViewAllDate] = useState<Date | null>(null);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);

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
    const dayEvents = EVENTS.filter(event => event.date === dateStr);
    
    if (selectedCategory === 'All Events') {
      return dayEvents;
    }
    return dayEvents.filter(event => event.category === selectedCategory);
  };

  return (
    <>
      <ContentWithSidebar 
        sidebar={
          <EventsSidebar 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        }
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Find an Event</h1>
            <p className="text-muted-foreground">
              Find events to get out of the house. Go for a ride, make a new friend.
            </p>
          </div>

          {/* Calendar with events displayed in each day */}
          <Calendar
            selectedDate={selectedDate}
            onMonthChange={setSelectedDate}
            events={EVENTS}
            onEventClick={handleEventClick}
            onViewAllClick={handleViewAllClick}
            selectedCategory={selectedCategory}
          />
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
