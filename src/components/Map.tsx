import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet icon fix requires accessing private property
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons for start and end markers
const startIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'start-marker'
});

const endIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'end-marker'
});

interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

export interface MapBounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

interface MapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (locationId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  route?: [number, number][]; // Optional route waypoints for rides
  showRouteMarkers?: boolean; // Show start/end markers for route
}

// Component to track map bounds and notify parent
function BoundsTracker({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        onBoundsChange({
          northEast: { lat: northEast.lat, lng: northEast.lng },
          southWest: { lat: southWest.lat, lng: southWest.lng },
        });
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        onBoundsChange({
          northEast: { lat: northEast.lat, lng: northEast.lng },
          southWest: { lat: southWest.lat, lng: southWest.lng },
        });
      }
    },
  });

  // Also call on initial mount
  useEffect(() => {
    if (onBoundsChange) {
      const bounds = map.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();
      
      onBoundsChange({
        northEast: { lat: northEast.lat, lng: northEast.lng },
        southWest: { lat: southWest.lat, lng: southWest.lng },
      });
    }
  }, [map, onBoundsChange]);

  return null;
}

// Component to handle route rendering with OSRM
function RouteLayer({ route, showRouteMarkers }: { route?: [number, number][]; showRouteMarkers?: boolean }) {
  const map = useMap();
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Initialize route layer if it doesn't exist
    if (!routeLayerRef.current) {
      routeLayerRef.current = L.layerGroup().addTo(map);
    }

    const routeLayer = routeLayerRef.current;

    // Clear existing route
    routeLayer.clearLayers();

    // If no route or less than 2 waypoints, return
    if (!route || route.length < 2) {
      return;
    }

    // Fetch route from OSRM
    const fetchRoute = async () => {
      try {
        // Convert waypoints to OSRM format: lng,lat
        const coordinatesString = route.map(([lat, lng]) => `${lng},${lat}`).join(';');
        const apiUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.error('OSRM API error:', response.status);
          return;
        }

        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const routeGeometry = data.routes[0].geometry;
          
          // Add the route line to the map
          const routeLine = L.geoJSON(routeGeometry, {
            style: {
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
            }
          });
          
          routeLine.addTo(routeLayer);

          // Add start and end markers if requested
          if (showRouteMarkers && route.length > 0) {
            // Start marker
            const startMarker = L.marker(route[0], { icon: startIcon });
            startMarker.bindPopup('<div class="p-2"><h3 class="font-semibold">Start</h3></div>');
            startMarker.addTo(routeLayer);

            // End marker
            const endMarker = L.marker(route[route.length - 1], { icon: endIcon });
            endMarker.bindPopup('<div class="p-2"><h3 class="font-semibold">End</h3></div>');
            endMarker.addTo(routeLayer);
          }

          // Fit map to route bounds
          map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
        }
      } catch (error) {
        console.error('Failed to fetch route from OSRM:', error);
      }
    };

    fetchRoute();

    // Cleanup function
    return () => {
      if (routeLayerRef.current) {
        routeLayerRef.current.clearLayers();
      }
    };
  }, [route, showRouteMarkers, map]);

  return null;
}

export default function Map({ 
  locations, 
  center = [39.8283, -98.5795], // Center of USA
  zoom = 4,
  onMarkerClick,
  onBoundsChange,
  route,
  showRouteMarkers = false
}: MapProps) {
  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Bounds tracker */}
        <BoundsTracker onBoundsChange={onBoundsChange} />
        
        {/* Route layer with OSRM routing */}
        <RouteLayer route={route} showRouteMarkers={showRouteMarkers} />
        
        {/* Regular location markers */}
        {locations.map((location) => (
          <Marker 
            key={location.id} 
            position={[location.lat, location.lng]}
            eventHandlers={{
              click: (e) => {
                if (onMarkerClick) {
                  onMarkerClick(location.id);
                  // Prevent the popup from opening
                  L.DomEvent.stopPropagation(e);
                }
              },
            }}
          >
            {!onMarkerClick && (
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{location.name}</h3>
                  {location.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {location.description}
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
