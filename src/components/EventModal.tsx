import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Map as MapIcon, ArrowLeft, FileText } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Map from '@/components/Map';
import { ROUTE_POINT_COLORS } from '@/../amplify/config/enums';

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
  route?: [number, number][];
  routePoints?: RoutePoint[];
}

interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
}

export default function EventModal({ event, isOpen, onClose, isOwner = false }: EventModalProps) {
  const navigate = useNavigate();
  const [showMap, setShowMap] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Fetch S3 URLs for images when event changes
  useEffect(() => {
    const fetchImageUrls = async () => {
      if (!event?.images || event.images.length === 0) {
        setImageUrls([]);
        return;
      }

      setLoadingImages(true);
      try {
        const urlPromises = event.images.map(async (imagePath) => {
          // Check if it's already a full URL (for backward compatibility)
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
          }
          
          // Otherwise, fetch from S3
          const result = await getUrl({
            path: imagePath,
          });
          return result.url.toString();
        });

        const urls = await Promise.all(urlPromises);
        setImageUrls(urls);
      } catch (error) {
        console.error('Error fetching image URLs:', error);
        setImageUrls([]);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImageUrls();
  }, [event?.images]);
  
  if (!event) return null;
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    // Parse the date string (YYYY-MM-DD format) and create date at noon to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isRideEvent = event.category === 'Ride' && event.route && event.route.length > 0;

  // Filter out generic "Waypoint" type points for display
  const displayableWaypoints = event.routePoints?.filter(point => point.type !== 'Waypoint') || [];

  // Calculate center point for route map
  const routeCenter: [number, number] = event.route && event.route.length > 0
    ? [
        event.route.reduce((sum, point) => sum + point[0], 0) / event.route.length,
        event.route.reduce((sum, point) => sum + point[1], 0) / event.route.length
      ]
    : [event.lat, event.lng];

  // Reset map view when modal closes
  const handleClose = () => {
    setShowMap(false);
    onClose();
  };

  const handleManageClick = () => {
    if (event) {
      onClose();
      navigate(`/events/edit/${event.id}`);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {!showMap ? (
          <>
            {/* Images */}
            {imageUrls.length > 0 && (
              <div className="w-full">
                {loadingImages ? (
                  <div className="w-full h-64 bg-muted animate-pulse rounded-t-lg" />
                ) : (
                  <>
                    <img 
                      src={imageUrls[0]} 
                      alt={event.title}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />
                    {imageUrls.length > 1 && (
                      <div className="grid grid-cols-3 gap-2 p-4">
                        {imageUrls.slice(1).map((url, idx) => (
                          <img 
                            key={idx}
                            src={url} 
                            alt={`${event.title} ${idx + 2}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </>
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
              <div className="mb-6">
                <h3 className="font-semibold mb-2">About this event</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {/* View Map button for Ride events */}
                {isRideEvent && (
                  <Button
                    onClick={() => setShowMap(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <MapIcon className="w-4 h-4" />
                    View Route Map
                  </Button>
                )}
                
                {/* View Flyer button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/events/flyer/${event.id}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Flyer
                </Button>
              </div>
            </div>

            {isOwner && (
              <DialogFooter className="px-6 pb-6">
                <Button onClick={handleManageClick} className="w-full">
                  Manage Event
                </Button>
              </DialogFooter>
            )}
          </>
        ) : (
          /* Map View */
          <div className="p-6">
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowMap(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </Button>
            </div>
            
            <div className="mb-4">
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
                {event.category}
              </Badge>
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <p className="text-muted-foreground mt-2">Route Map</p>
            </div>

            <Map
              locations={[]}
              center={routeCenter}
              zoom={12}
              route={event.route}
              routePoints={event.routePoints}
              showRouteMarkers={true}
            />

            {/* Waypoints List */}
            {displayableWaypoints.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="font-semibold text-sm">Route Points</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {displayableWaypoints.map((point, index) => {
                    const color = ROUTE_POINT_COLORS[point.type as keyof typeof ROUTE_POINT_COLORS] || '#3b82f6';
                    
                    return (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0" 
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {point.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                #{point.order}
                              </span>
                            </div>
                            {point.description && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {point.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm mb-3">Legend</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ROUTE_POINT_COLORS)
                  .filter(([type]) => type !== 'Waypoint')
                  .map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs">{type.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  The blue line shows the planned route path.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
