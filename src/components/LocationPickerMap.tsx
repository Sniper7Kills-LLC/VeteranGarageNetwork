import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

interface LocationPickerMapProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) => void;
  initialPosition?: [number, number];
}

function LocationMarker({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: number, lng: number) => void 
}) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function LocationPickerMap({ 
  onLocationSelect,
  initialPosition = [39.8283, -98.5795] // Center of USA
}: LocationPickerMapProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleLocationClick = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    
    try {
      // Use Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        
        // Build street address from components with comprehensive fallbacks
        let streetAddress = '';
        
        // Try various combinations for complete street address
        if (addr.house_number && addr.road) {
          streetAddress = `${addr.house_number} ${addr.road}`;
        } else if (addr.building && addr.road) {
          streetAddress = `${addr.building} ${addr.road}`;
        } else if (addr.amenity && addr.road) {
          streetAddress = `${addr.amenity}, ${addr.road}`;
        } else if (addr.road) {
          streetAddress = addr.road;
        } else if (addr.street) {
          streetAddress = addr.street;
        } else if (addr.pedestrian) {
          streetAddress = addr.pedestrian;
        } else if (addr.neighbourhood) {
          streetAddress = addr.neighbourhood;
        } else if (addr.suburb) {
          streetAddress = addr.suburb;
        }
        
        // Get city name with comprehensive fallbacks
        let cityName = 
          addr.city || 
          addr.town || 
          addr.village || 
          addr.municipality || 
          addr.hamlet || 
          addr.county || 
          addr.state_district || 
          '';
        
        // Remove common prefixes
        cityName = cityName.replace(/^(Town of|City of|Village of|Borough of|County of)\s+/i, '');
        
        // Get state with fallbacks
        const stateName = addr.state || addr.province || addr.region || '';
        
        // Get zip code with fallbacks
        const zipCode = addr.postcode || addr.postal_code || '';
        
        onLocationSelect({
          lat,
          lng,
          address: streetAddress,
          city: cityName,
          state: stateName,
          zipCode: zipCode,
        });
      } else {
        // If geocoding fails, just return coordinates
        onLocationSelect({ lat, lng });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // If geocoding fails, just return coordinates
      onLocationSelect({ lat, lng });
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Click on the map to select a location
        {isGeocoding && <span className="ml-2">(Looking up address...)</span>}
      </div>
      <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={initialPosition}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={handleLocationClick} />
        </MapContainer>
      </div>
    </div>
  );
}
