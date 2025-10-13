import { Clock, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  if (!date) return null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Events on {formatDate(date)}
          </DialogTitle>
          <DialogDescription>
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Events list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-3">
            {events.map(event => (
              <Button
                key={event.id}
                variant="outline"
                onClick={() => {
                  onEventClick(event);
                  onClose();
                }}
                className="w-full h-auto p-4 text-left justify-start hover:bg-accent"
              >
                <div className="flex gap-4 w-full">
                  {event.images && event.images.length > 0 && (
                    <img 
                      src={event.images[0]} 
                      alt={event.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/10">
                      {event.category}
                    </Badge>
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
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
