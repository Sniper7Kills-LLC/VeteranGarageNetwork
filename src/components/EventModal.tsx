import { X, Calendar, Clock, MapPin } from 'lucide-react';
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

interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
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
  
  if (!isOpen || !event) return null;
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Images */}
        {event.images && event.images.length > 0 && (
          <div className="w-full">
            <img 
              src={event.images[0]} 
              alt={event.title}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            {event.images.length > 1 && (
              <div className="grid grid-cols-3 gap-2 p-4">
                {event.images.slice(1).map((img, idx) => (
                  <img 
                    key={idx}
                    src={img} 
                    alt={`${event.title} ${idx + 2}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {/* Category badge */}
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
            {event.category}
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
          
          {/* Event details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            
            <div className="flex items-start gap-3 text-muted-foreground">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{event.time}</span>
            </div>
            
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">About this event</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
