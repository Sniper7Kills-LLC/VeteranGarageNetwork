import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface MapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
}

export default function Map({ 
  locations, 
  center = [39.8283, -98.5795], // Center of USA
  zoom = 4 
}: MapProps) {
  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border">
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
        {locations.map((location) => (
          <Marker key={location.id} position={[location.lat, location.lng]}>
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
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
