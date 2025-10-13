import { Calendar, Clock, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
  if (!event) return null;
  
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
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
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
            {event.category}
          </Badge>
          
          {/* Title */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
          </DialogHeader>
          
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
      </DialogContent>
    </Dialog>
  );
}
