import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowLeft, Download } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { domToJpeg } from 'modern-screenshot';
import ContentOnly from '@/components/layouts/ContentOnly';
import Map from '@/components/Map';
import ImageCarousel from '@/components/ImageCarousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTE_POINT_COLORS } from '@/../amplify/config/enums';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

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
  chapterAssociations?: Array<{
    relationship: string;
    chapter: {
      name: string;
      club: {
        name: string;
      };
    };
  }>;
}

export default function EventFlyer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [event, setEvent] = useState<Event | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);

  // Get the current URL for QR code
  const flyerUrl = window.location.href;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('No event ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const client = generateClient<Schema>();

        // Use getPublicEvent query to allow guest access to approved events
        const { data: eventData } = await client.queries.getPublicEvent({ id });

        if (!eventData) {
          setError('Event not found');
          setIsLoading(false);
          return;
        }

        const locationParts = [eventData.address, eventData.city, eventData.state].filter(Boolean);
        const location = locationParts.join(', ') || 'Location TBD';

        let route: [number, number][] | undefined;
        let routePoints: RoutePoint[] | undefined;
        if (eventData.route && Array.isArray(eventData.route)) {
          const sortedRoute = eventData.route
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

        // Note: Custom queries don't return nested associations
        // If chapter associations are needed, use listPublicEventAssociations query separately
        const transformedEvent: Event = {
          id: eventData.id,
          title: eventData.title,
          date: eventData.date,
          time: eventData.time,
          location,
          description: eventData.description,
          category: eventData.category || 'Meetup',
          images: eventData.images?.filter((img): img is string => img !== null) || undefined,
          lat: eventData.latitude,
          lng: eventData.longitude,
          route,
          routePoints,
          chapterAssociations: undefined, // Custom queries don't support nested data
        };

        setEvent(transformedEvent);

        if (transformedEvent.images && transformedEvent.images.length > 0) {
          const urlPromises = transformedEvent.images.map(async (imagePath) => {
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
              return imagePath;
            }
            const result = await getUrl({ path: imagePath });
            return result.url.toString();
          });
          const urls = await Promise.all(urlPromises);
          setImageUrls(urls);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, authStatus]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSaveAsImage = async () => {
    if (!flyerRef.current || !event) return;

    try {
      setIsSavingImage(true);
      
      console.log('Starting image save process...');
      
      // Wait for images to load - increased delay to 1500ms for S3 images
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Wait for all <img> elements in the flyer to be fully loaded
      const images = flyerRef.current.querySelectorAll('img');
      console.log(`Found ${images.length} images to check`);
      
      // Convert images to data URLs to avoid CORS issues
      const imageConversionPromises = Array.from(images).map(async (img, idx) => {
        try {
          // If already loaded and has content
          if (img.complete && img.naturalWidth > 0) {
            console.log(`Image ${idx} already loaded: ${img.src.substring(0, 50)}...`);
            
            // Convert to data URL to avoid CORS
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
              img.src = dataUrl;
              console.log(`Image ${idx} converted to data URL`);
            }
            return Promise.resolve();
          }
          
          // Otherwise wait for load
          console.log(`Waiting for image ${idx} to load...`);
          return new Promise<void>(resolve => {
            img.onload = async () => {
              console.log(`Image ${idx} loaded`);
              // Convert to data URL
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                img.src = dataUrl;
                console.log(`Image ${idx} converted to data URL`);
              }
              resolve();
            };
            img.onerror = (e) => {
              console.error(`Image ${idx} failed to load:`, e);
              resolve(); // Don't block on errors
            };
          });
        } catch (err) {
          console.error(`Error processing image ${idx}:`, err);
          return Promise.resolve();
        }
      });
      
      await Promise.all(imageConversionPromises);
      console.log('All images processed, starting screenshot...');
      
      // Small delay after conversion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use modern-screenshot which supports modern CSS including oklch
      const dataUrl = await domToJpeg(flyerRef.current, {
        quality: 0.95,
        scale: 2,
        backgroundColor: '#ffffff',
      });

      console.log('Screenshot captured successfully');

      // Download the image
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flyer.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Image download initiated');
    } catch (err) {
      console.error('Error saving image:', err);
      alert('Failed to save image. Please try using the Print function instead.');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleImageClick = (index: number) => {
    setCarouselIndex(index);
    setIsCarouselOpen(true);
  };

  if (isLoading) {
    return (
      <ContentOnly>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading event...</div>
          </div>
        </div>
      </ContentOnly>
    );
  }

  if (error || !event) {
    return (
      <ContentOnly>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="text-lg text-destructive">{error || 'Event not found'}</div>
            <Button onClick={() => navigate('/events')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </ContentOnly>
    );
  }

  const isRideEvent = event.category === 'Ride' && event.route && event.route.length > 0;

  const routeCenter: [number, number] = event.route && event.route.length > 0
    ? [
        event.route.reduce((sum, point) => sum + point[0], 0) / event.route.length,
        event.route.reduce((sum, point) => sum + point[1], 0) / event.route.length,
      ]
    : [event.lat, event.lng];

  return (
    <ContentOnly>
      <div className="flyer-container max-w-[8.5in] mx-auto bg-white">
        {/* Controls */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm p-4 flex gap-2">
          <Button variant="outline" onClick={() => navigate('/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <Button onClick={handleSaveAsImage} disabled={isSavingImage}>
            <Download className="w-4 h-4 mr-2" />
            {isSavingImage ? 'Saving...' : 'Save as Image'}
          </Button>
        </div>

        {/* Flyer Content */}
        <div ref={flyerRef} className="flyer-content p-8 bg-white">
          {/* Title and Category - Full Width */}
          <div className="mb-6">
            <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
              {event.category}
            </Badge>
            <h1 className="text-4xl font-bold leading-tight">{event.title}</h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Event Details */}
            <div className="space-y-6">
              {/* Description First */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">About This Event</h2>
                <p className="text-base whitespace-pre-line leading-relaxed">{event.description}</p>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="font-semibold text-base">
                    {formatDate(event.date)}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="space-y-1">
                    {event.time.includes('|') ? (
                      <>
                        {event.time.split('|').map((time, idx) => (
                          <div key={idx} className="font-semibold text-base whitespace-nowrap">
                            {time.trim()}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="font-semibold text-base whitespace-nowrap">{event.time}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="space-y-0.5">
                    {event.location.split(', ').map((line, idx) => (
                      <div key={idx} className="font-semibold text-base">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chapter Associations */}
              {event.chapterAssociations && event.chapterAssociations.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Hosted By</h2>
                  <div className="space-y-2">
                    {event.chapterAssociations.map((assoc, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-sm font-semibold">{assoc.chapter.club.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assoc.chapter.name} - {assoc.relationship}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Route Map */}
            <div className="space-y-6">
              {/* Route Map for Ride Events */}
              {isRideEvent && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Route Map</h2>
                  <div className="w-full h-[300px] rounded-lg overflow-hidden border-2 border-border">
                    <Map
                      locations={[]}
                      center={routeCenter}
                      zoom={10}
                      route={event.route}
                      routePoints={event.routePoints}
                      showRouteMarkers={true}
                      displayPointTypes={['Start', 'Stop', 'End']}
                    />
                  </div>

                  {/* Legend - Only Start, Stop, End */}
                  <div className="p-3 bg-muted rounded-lg">
                    <h3 className="font-semibold text-xs mb-2">Legend</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {['Start', 'Stop', 'End'].map((type) => {
                        const color = ROUTE_POINT_COLORS[type as keyof typeof ROUTE_POINT_COLORS];
                        return (
                          <div key={type} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-medium">{type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Event Photos - Full Width at Bottom */}
          {imageUrls.length > 0 && (
            <div className="space-y-3 mt-8">
              <h2 className="text-xl font-semibold">Event Photos</h2>
              <div className="grid grid-cols-4 gap-3">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-colors"
                    onClick={() => handleImageClick(idx)}
                  >
                    <img
                      src={url}
                      alt={`${event.title} ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center print:hidden">
                Click any image to view slideshow
              </p>
            </div>
          )}

          {/* Footer with Branding and QR Code */}
          <div className="border-t-2 border-border pt-6 mt-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold">VeteranGarageNetwork.com</div>
                <div className="text-sm text-muted-foreground">
                  Scan to view this event online
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border-2 border-border">
                <QRCodeSVG value={flyerUrl} size={100} level="M" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Carousel */}
      <ImageCarousel
        images={imageUrls}
        initialIndex={carouselIndex}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .flyer-container {
            max-width: 100%;
            margin: 0;
            box-shadow: none;
          }
          
          .flyer-content {
            padding: 0.5in;
          }
          
          /* Ensure images print properly */
          img {
            max-width: 100%;
            page-break-inside: avoid;
          }
          
          /* Ensure map container prints */
          .leaflet-container {
            height: 300px !important;
          }
          
          /* Maintain two-column layout on print */
          @media (min-width: 768px) {
            .grid-cols-1.md\\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
        }
        
        @page {
          size: letter;
          margin: 0.5in;
        }
      `}</style>
    </ContentOnly>
  );
}
