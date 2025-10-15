import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ROUTE_POINT_COLORS } from '@/../amplify/config/enums';

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

interface RoutePoint {
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  order: number;
}

interface MapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (locationId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  route?: [number, number][]; // Optional route waypoints for rides
  routePoints?: RoutePoint[]; // Full route point data with types and descriptions
  showRouteMarkers?: boolean; // Show start/end markers for route
  displayPointTypes?: string[]; // Array of point types to display (e.g., ['Start', 'Stop', 'End'])
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
function RouteLayer({ 
  route, 
  routePoints, 
  showRouteMarkers,
  displayPointTypes
}: { 
  route?: [number, number][]; 
  routePoints?: RoutePoint[];
  showRouteMarkers?: boolean;
  displayPointTypes?: string[];
}) {
  const map = useMap();
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  // Create custom colored icon for marker
  const createColoredIcon = (color: string) => {
    const svgIcon = `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
      </svg>
    `;
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  };

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
          
          // Add the route line to the map with single blue color
          const routeLine = L.geoJSON(routeGeometry, {
            style: {
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
            }
          });
          routeLine.addTo(routeLayer);

          // Add waypoint markers if we have route points data
          if (routePoints && routePoints.length > 0) {
            // Filter points based on displayPointTypes if provided, otherwise filter out Waypoint and Blocker
            const displayablePoints = displayPointTypes 
              ? routePoints.filter(p => displayPointTypes.includes(p.type))
              : routePoints.filter(p => p.type !== 'Waypoint' && p.type !== 'Blocker');
            
            displayablePoints.forEach((point) => {
              const color = ROUTE_POINT_COLORS[point.type as keyof typeof ROUTE_POINT_COLORS] || '#3b82f6';
              const marker = L.marker([point.latitude, point.longitude], {
                icon: createColoredIcon(color)
              });
              
              // Add popup with point information
              const popupContent = `
                <div class="p-2">
                  <h3 class="font-semibold">${point.type.replace(/_/g, ' ')}</h3>
                  ${point.description ? `<p class="text-sm mt-1">${point.description}</p>` : ''}
                </div>
              `;
              marker.bindPopup(popupContent);
              marker.addTo(routeLayer);
            });
          } else if (showRouteMarkers && route.length > 0) {
            // Fallback to basic start/end markers if no route points data
            const startMarker = L.marker(route[0], { icon: startIcon });
            startMarker.bindPopup('<div class="p-2"><h3 class="font-semibold">Start</h3></div>');
            startMarker.addTo(routeLayer);

            const endMarker = L.marker(route[route.length - 1], { icon: endIcon });
            endMarker.bindPopup('<div class="p-2"><h3 class="font-semibold">End</h3></div>');
            endMarker.addTo(routeLayer);
          }

          // Fit map to route bounds with appropriate padding
          const bounds = L.geoJSON(routeGeometry).getBounds();
          map.fitBounds(bounds, { padding: [20, 20] });
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
  }, [route, routePoints, showRouteMarkers, map]);

  return null;
}

export default function Map({ 
  locations, 
  center = [39.8283, -98.5795], // Center of USA
  zoom = 4,
  onMarkerClick,
  onBoundsChange,
  route,
  routePoints,
  showRouteMarkers = false,
  displayPointTypes
}: MapProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border relative z-0">
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
        <RouteLayer 
          route={route} 
          routePoints={routePoints}
          showRouteMarkers={showRouteMarkers}
          displayPointTypes={displayPointTypes}
        />
        
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
