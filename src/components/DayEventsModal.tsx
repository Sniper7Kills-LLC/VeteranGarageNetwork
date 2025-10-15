import { useState, useEffect } from 'react';
import { Clock, MapPin, Map as MapIcon, List } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Map from '@/components/Map';

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
  approved?: boolean;
}

interface DayEventsModalProps {
  date: Date | null;
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  onEventClick: (event: Event) => void;
}

export default function DayEventsModal({ date, events, isOpen, onClose, onEventClick }: DayEventsModalProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [eventImageUrls, setEventImageUrls] = useState<Record<string, string[]>>({});
  const [loadingImages, setLoadingImages] = useState(false);

  // Fetch S3 URLs for all event images
  useEffect(() => {
    const fetchAllImageUrls = async () => {
      if (!events || events.length === 0) {
        setEventImageUrls({});
        return;
      }

      setLoadingImages(true);
      try {
        const urlsMap: Record<string, string[]> = {};

        await Promise.all(
          events.map(async (event) => {
            if (!event.images || event.images.length === 0) {
              return;
            }

            const urlPromises = event.images.map(async (imagePath) => {
              // Check if it's already a full URL (for backward compatibility)
              if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                return imagePath;
              }
              
              // Otherwise, fetch from S3
              try {
                const result = await getUrl({
                  path: imagePath,
                });
                return result.url.toString();
              } catch (error) {
                console.error(`Error fetching image URL for ${imagePath}:`, error);
                return '';
              }
            });

            const urls = await Promise.all(urlPromises);
            urlsMap[event.id] = urls.filter(url => url !== '');
          })
        );

        setEventImageUrls(urlsMap);
      } catch (error) {
        console.error('Error fetching image URLs:', error);
        setEventImageUrls({});
      } finally {
        setLoadingImages(false);
      }
    };

    fetchAllImageUrls();
  }, [events]);
  
  if (!date) return null;
  
  const formatDate = (date: Date) => {
    // Use UTC methods to avoid timezone offset issues
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Create a new date at noon to avoid timezone issues
    const safeDate = new Date(year, month, day, 12, 0, 0);
    
    return safeDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Convert events to map locations
  const mapLocations = events.map(event => ({
    id: event.id,
    name: event.title,
    lat: event.lat,
    lng: event.lng,
    description: `${event.time} - ${event.category}`
  }));

  // Calculate center point for map
  const centerLat = events.length > 0 
    ? events.reduce((sum, e) => sum + e.lat, 0) / events.length 
    : 37.7749;
  const centerLng = events.length > 0 
    ? events.reduce((sum, e) => sum + e.lng, 0) / events.length 
    : -122.4194;

  const handleMarkerClick = (locationId: string) => {
    const event = events.find(e => e.id === locationId);
    if (event) {
      onEventClick(event);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Events on {formatDate(date)}
              </DialogTitle>
              <DialogDescription>
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="flex items-center gap-2"
            >
              {viewMode === 'list' ? (
                <>
                  <MapIcon className="w-4 h-4" />
                  Map View
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  List View
                </>
              )}
            </Button>
          </div>
        </DialogHeader>
        
        {/* Content - List or Map View */}
        <div className="flex-1 overflow-hidden -mx-6 px-6">
          {viewMode === 'list' ? (
            <div className="h-full overflow-y-auto">
              <div className="space-y-3">
                {events.map(event => (
                  <Button
                    key={event.id}
                    variant="outline"
                    onClick={() => {
                      onEventClick(event);
                      onClose();
                    }}
                    className="w-full h-auto p-4 text-left justify-start hover:bg-accent relative"
                  >
                    {event.approved === false && (
                      <Badge variant="destructive" className="absolute top-2 right-2 h-2 w-2 p-0 rounded-full" />
                    )}
                    <div className="flex gap-4 w-full">
                      {event.images && event.images.length > 0 && (
                        <>
                          {loadingImages ? (
                            <div className="w-20 h-20 bg-muted animate-pulse rounded-lg flex-shrink-0" />
                          ) : eventImageUrls[event.id]?.[0] ? (
                            <img 
                              src={eventImageUrls[event.id][0]} 
                              alt={event.title}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : null}
                        </>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {event.category}
                          </Badge>
                          {event.approved === false && (
                            <Badge variant="destructive" className="text-xs">
                              Unapproved
                            </Badge>
                          )}
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
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full">
              <Map
                locations={mapLocations}
                center={[centerLat, centerLng]}
                zoom={13}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
