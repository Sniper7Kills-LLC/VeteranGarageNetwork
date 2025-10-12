import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map from '@/components/Map';

// Local interface - will be replaced by Amplify-generated types
interface ShopLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'shop';
  description?: string;
}

// Static sample data - will be replaced with filtered data from Amplify
const sampleShops: ShopLocation[] = [
  {
    id: '1',
    name: 'Performance Auto Shop - Los Angeles',
    lat: 34.0522,
    lng: -118.2437,
    type: 'shop',
    description: 'Full-service performance and restoration shop',
  },
  {
    id: '2',
    name: 'Classic Car Restoration - Phoenix',
    lat: 33.4484,
    lng: -112.0740,
    type: 'shop',
    description: 'Specializing in classic car restoration',
  },
  {
    id: '3',
    name: 'Veterans Auto Repair - Chicago',
    lat: 41.8781,
    lng: -87.6298,
    type: 'shop',
    description: 'Veteran-owned auto repair and maintenance',
  },
  {
    id: '4',
    name: 'Custom Garage - Portland',
    lat: 45.5152,
    lng: -122.6784,
    type: 'shop',
    description: 'Custom builds and modifications',
  },
  {
    id: '5',
    name: 'Precision Motors - Atlanta',
    lat: 33.7490,
    lng: -84.3880,
    type: 'shop',
    description: 'High-performance tuning and repairs',
  },
  {
    id: '6',
    name: 'Vintage Auto Works - Boston',
    lat: 42.3601,
    lng: -71.0589,
    type: 'shop',
    description: 'Vintage and classic car specialists',
  },
];

function ShopsSidebar() {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            All Shops
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shops() {
  return (
    <ContentWithSidebar sidebar={<ShopsSidebar />}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Find a Shop</h1>
        <Map locations={sampleShops} />
      </div>
    </ContentWithSidebar>
  );
}
