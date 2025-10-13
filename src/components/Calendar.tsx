import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  route?: [number, number][];
}

interface CalendarProps {
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
  events: Event[];
  onEventClick: (event: Event) => void;
  onViewAllClick: (date: Date) => void;
  selectedCategory: string;
}

export default function Calendar({ 
  selectedDate, 
  onMonthChange, 
  events,
  onEventClick,
  onViewAllClick,
  selectedCategory
}: CalendarProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Get current date for highlighting
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = today.getDate();
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Navigate to previous month
  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };
  
  // Get events for a specific day
  const getEventsForDay = (day: number): Event[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(event => event.date === dateStr);
    
    // Apply category filter
    if (selectedCategory === 'All Events') {
      return dayEvents;
    }
    return dayEvents.filter(event => event.category === selectedCategory);
  };
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="min-h-32 border border-border bg-muted/30" />
    );
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === currentDay;
    const dayEvents = getEventsForDay(day);
    const maxEventsToShow = 3;
    const hasMoreEvents = dayEvents.length > maxEventsToShow;
    const eventsToDisplay = dayEvents.slice(0, maxEventsToShow);
    
    calendarDays.push(
      <div
        key={day}
        className={`min-h-32 border border-border bg-card p-2 flex flex-col ${
          isToday ? 'ring-2 ring-primary' : ''
        }`}
      >
        {/* Day number - clickable if there are events */}
        <button
          onClick={() => dayEvents.length > 0 && onViewAllClick(new Date(year, month, day))}
          className={`text-sm font-semibold mb-1 text-left ${
            isToday ? 'text-primary' : ''
          } ${
            dayEvents.length > 0 ? 'hover:underline cursor-pointer' : 'cursor-default'
          }`}
          disabled={dayEvents.length === 0}
          title={dayEvents.length > 0 ? 'View all events for this day' : ''}
        >
          {day}
        </button>
        
        {/* Events list */}
        <div className="flex-1 space-y-1 overflow-hidden">
          {eventsToDisplay.map(event => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className="w-full text-left px-2 py-1 text-xs rounded bg-primary/10 hover:bg-primary/20 transition-colors truncate"
              title={`${event.time} - ${event.title}`}
            >
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-muted-foreground truncate">{event.time}</div>
            </button>
          ))}
          
          {/* View all button */}
          {hasMoreEvents && (
            <button
              onClick={() => onViewAllClick(new Date(year, month, day))}
              className="w-full text-xs text-primary hover:underline text-left px-2 py-1"
            >
              +{dayEvents.length - maxEventsToShow} more
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Day names */}
      <div className="grid grid-cols-7 gap-0 mb-0">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2 border-b border-border">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays}
      </div>
    </div>
  );
}
