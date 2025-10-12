import { X, Clock, MapPin } from 'lucide-react';
import { useEffect } from 'react';

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

interface DayEventsModalProps {
  date: Date | null;
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  onEventClick: (event: Event) => void;
}

export default function DayEventsModal({ date, events, isOpen, onClose, onEventClick }: DayEventsModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen || !date) return null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold pr-10">
            Events on {formatDate(date)}
          </h2>
          <p className="text-muted-foreground mt-1">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        
        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => {
                  onEventClick(event);
                  onClose();
                }}
                className="w-full text-left p-4 border border-border rounded-lg bg-card hover:bg-accent transition-colors"
              >
                <div className="flex gap-4">
                  {event.images && event.images.length > 0 && (
                    <img 
                      src={event.images[0]} 
                      alt={event.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded mb-2">
                      {event.category}
                    </div>
                    <h3 className="font-semibold mb-2">{event.title}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
