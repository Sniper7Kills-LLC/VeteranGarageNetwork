import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { ROUTE_POINT_TYPE_VALUES } from '@/../amplify/config/enums';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RoutePoint {
  latitude: number;
  longitude: number;
  type: 'Start' | 'End' | 'Waypoint' | 'Stop' | 'Join_In' | 'Blockers';
  description: string;
  order: number;
}

// Color mapping for different waypoint types
const MARKER_COLORS: Record<RoutePoint['type'], string> = {
  'Start': '#22c55e',      // Green
  'End': '#ef4444',        // Red
  'Waypoint': '#3b82f6',   // Blue
  'Stop': '#f97316',       // Orange
  'Join_In': '#a855f7',    // Purple
  'Blockers': '#eab308',   // Yellow
};

interface RouteBuilderProps {
  value: RoutePoint[];
  onChange: (points: RoutePoint[]) => void;
  center?: [number, number];
}

interface RouteInfo {
  distance: number;
  duration: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function RouteBuilder({ value, onChange, center = [39.8283, -98.5795] }: RouteBuilderProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>(value);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  
  // Zoom level: 4 shows entire US, higher if user has selected a location
  const mapZoom = center ? 4 : 6;

  // Sync internal state with prop value
  useEffect(() => {
    setRoutePoints(value);
  }, [value]);

  // Fetch route from OSRM when points change
  useEffect(() => {
    if (routePoints.length < 2) {
      setRouteLine([]);
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      setIsFetchingRoute(true);
      const coordinatesString = routePoints
        .map(wp => `${wp.longitude},${wp.latitude}`)
        .join(';');
      const apiUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRouteLine(coordinates);
          setRouteInfo({
            distance: route.distance,
            duration: route.duration,
          });
        } else {
          setRouteLine([]);
          setRouteInfo(null);
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
        setRouteLine([]);
        setRouteInfo(null);
      } finally {
        setIsFetchingRoute(false);
      }
    };

    fetchRoute();
  }, [routePoints]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isFetchingRoute) return;
    
    // Determine default type: first point is Start, rest are Waypoint
    let defaultType: RoutePoint['type'] = 'Waypoint';
    if (routePoints.length === 0) {
      defaultType = 'Start';
    }
    
    const newPoint: RoutePoint = {
      latitude: lat,
      longitude: lng,
      type: defaultType,
      description: `Waypoint ${routePoints.length + 1}`,
      order: routePoints.length + 1,
    };
    
    const updatedPoints = [...routePoints, newPoint];
    setRoutePoints(updatedPoints);
    onChange(updatedPoints);
  }, [routePoints, onChange, isFetchingRoute]);

  const handleMarkerDrag = useCallback((index: number, lat: number, lng: number) => {
    const updatedPoints = [...routePoints];
    updatedPoints[index] = {
      ...updatedPoints[index],
      latitude: lat,
      longitude: lng,
    };
    setRoutePoints(updatedPoints);
    onChange(updatedPoints);
  }, [routePoints, onChange]);

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

  const handleDeletePoint = (index: number) => {
    const updatedPoints = routePoints
      .filter((_, i) => i !== index)
      .map((point, i) => ({ ...point, order: i + 1 }));
    setRoutePoints(updatedPoints);
    onChange(updatedPoints);
  };

  const handleUpdatePoint = (index: number, field: keyof RoutePoint, value: string) => {
    const updatedPoints = [...routePoints];
    if (field === 'type') {
      updatedPoints[index] = { ...updatedPoints[index], type: value as typeof ROUTE_POINT_TYPE_VALUES[number] };
    } else if (field === 'description') {
      updatedPoints[index] = { ...updatedPoints[index], description: value };
    }
    setRoutePoints(updatedPoints);
    onChange(updatedPoints);
  };

  const handleClearRoute = () => {
    setRoutePoints([]);
    onChange([]);
    setRouteLine([]);
    setRouteInfo(null);
  };

  const formatDistance = (meters: number) => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} miles`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <MapContainer
              center={center}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />
              
              {/* Route line */}
              {routeLine.length > 0 && (
                <Polyline
                  positions={routeLine}
                  pathOptions={{ color: '#0055ff', weight: 5, opacity: 0.7 }}
                />
              )}
              
              {/* Markers */}
              {routePoints.map((point, index) => (
                <Marker
                  key={index}
                  position={[point.latitude, point.longitude]}
                  draggable={true}
                  icon={createColoredIcon(MARKER_COLORS[point.type])}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleMarkerDrag(index, position.lat, position.lng);
                    },
                  }}
                />
              ))}
            </MapContainer>
          </div>
          
          {/* Route Info */}
          {routeInfo && (
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Distance:</strong> {formatDistance(routeInfo.distance)}</p>
              <p><strong>Est. Time:</strong> {formatDuration(routeInfo.duration)}</p>
            </div>
          )}
        </div>

        {/* Waypoints List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Route Points</h3>
            {routePoints.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClearRoute}
              >
                Clear Route
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Click on the map to add waypoints. Create a detailed route with multiple stops.
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {routePoints.length === 0 ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your route will appear here.
                </p>
              </div>
            ) : (
              routePoints.map((point, index) => (
                <div key={index} className="p-3 bg-card border border-border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Point {point.order}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePoint(index)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`point-type-${index}`} className="text-xs">
                        Type
                      </Label>
                      <select
                        id={`point-type-${index}`}
                        value={point.type}
                        onChange={(e) => handleUpdatePoint(index, 'type', e.target.value)}
                        className="w-full mt-1 px-2 py-1 text-sm border border-input bg-background rounded-md"
                      >
                        {ROUTE_POINT_TYPE_VALUES.map((type) => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`point-desc-${index}`} className="text-xs">
                        Description
                      </Label>
                      <Input
                        id={`point-desc-${index}`}
                        type="text"
                        value={point.description}
                        onChange={(e) => handleUpdatePoint(index, 'description', e.target.value)}
                        className="mt-1 text-sm"
                        placeholder="e.g., Starting point"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
