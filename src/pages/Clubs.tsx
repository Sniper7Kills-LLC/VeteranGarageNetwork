import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map from '@/components/Map';

// Local interface - will be replaced by Amplify-generated types
interface ClubLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'club';
  description?: string;
}

// Static sample data - will be replaced with filtered data from Amplify
const sampleClubs: ClubLocation[] = [
  {
    id: '1',
    name: 'Veterans Garage - San Diego',
    lat: 32.7157,
    lng: -117.1611,
    type: 'club',
    description: 'San Diego chapter of Veterans Garage',
  },
  {
    id: '2',
    name: 'Veterans Garage - Austin',
    lat: 30.2672,
    lng: -97.7431,
    type: 'club',
    description: 'Austin chapter of Veterans Garage',
  },
  {
    id: '3',
    name: 'Veterans Garage - Denver',
    lat: 39.7392,
    lng: -104.9903,
    type: 'club',
    description: 'Denver chapter of Veterans Garage',
  },
  {
    id: '4',
    name: 'Veterans Garage - Seattle',
    lat: 47.6062,
    lng: -122.3321,
    type: 'club',
    description: 'Seattle chapter of Veterans Garage',
  },
  {
    id: '5',
    name: 'Veterans Garage - Miami',
    lat: 25.7617,
    lng: -80.1918,
    type: 'club',
    description: 'Miami chapter of Veterans Garage',
  },
];

function ClubsSidebar() {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            All Clubs
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clubs() {
  return (
    <ContentWithSidebar sidebar={<ClubsSidebar />}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Find a Club</h1>
        <Map locations={sampleClubs} />
      </div>
    </ContentWithSidebar>
  );
}
