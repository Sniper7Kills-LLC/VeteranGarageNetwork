import { useState, useEffect, useMemo } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map from '@/components/Map';
import ShopModal from '@/components/ShopModal';
import CreateShopModal from '@/components/CreateShopModal';
import ClubFilter from '@/components/filters/ClubFilter';
import ShopServiceFilter from '@/components/filters/ShopServiceFilter';
import { Button } from '@/components/ui/button';

/**
 * AWS Amplify Start
 */
// Imports
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";

/**
 * AWS Amplify End
 */

// Import shop services from centralized config
import { SHOP_SERVICE_VALUES, SHOP_SERVICE_DESCRIPTIONS } from '@/../amplify/config/enums';

// Type definitions
interface Club {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
}

interface ClubAssociation {
  id: string;
  clubId: string;
  clubName: string;
  relationship: string;
  details?: string;
}

interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  clubAssociations: ClubAssociation[];
}

// Mock data for shops with club associations (will be replaced with database data in the future)
const mockShops: Shop[] = [
  {
    id: 'cc-sd-shop',
    name: 'Combat Customs Garage - San Diego',
    description: 'Official Combat Customs shop specializing in custom builds',
    address: '1234 Custom Ave',
    city: 'San Diego',
    state: 'CA',
    zipCode: '92101',
    latitude: 32.7157,
    longitude: -117.1611,
    phone: '(619) 555-1000',
    email: 'shop@combatcustoms.com',
    website: 'https://combatcustoms.com',
    services: ['Custom Builds', 'Repairs', 'Fabrication', 'Paint & Body'],
    clubAssociations: [
      {
        id: 'cc-sd-shop-1',
        clubId: 'combat-customs',
        clubName: 'Combat Customs',
        relationship: 'Official Club Shop',
        details: 'Primary shop for all Combat Customs San Diego chapter members',
      },
    ],
  },
  {
    id: 'cc-la-shop',
    name: 'Combat Customs Garage - Los Angeles',
    description: 'LA-based custom motorcycle and car shop',
    address: '5678 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90028',
    latitude: 34.0522,
    longitude: -118.2437,
    phone: '(213) 555-2000',
    email: 'la@combatcustoms.com',
    website: 'https://combatcustoms.com/la',
    services: ['Custom Builds', 'Performance Tuning', 'Restoration', 'Welding'],
    clubAssociations: [
      {
        id: 'cc-la-shop-1',
        clubId: 'combat-customs',
        clubName: 'Combat Customs',
        relationship: 'Official Club Shop',
        details: 'Headquarters for Combat Customs LA chapter',
      },
    ],
  },
  {
    id: 'hog-denver-dealer',
    name: 'Mile High Harley-Davidson',
    description: 'Official Harley-Davidson dealership',
    address: '2468 Harley Way',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    latitude: 39.7392,
    longitude: -104.9903,
    phone: '(303) 555-3000',
    email: 'info@milehighhd.com',
    website: 'https://milehighhd.com',
    services: ['Sales', 'Service', 'Parts', 'Financing', 'Accessories'],
    clubAssociations: [
      {
        id: 'hog-denver-dealer-1',
        clubId: 'hog',
        clubName: 'HOG (Harley Owners Group)',
        relationship: 'Official HOG Dealership',
        details: 'Sponsoring dealership for Mile High HOG chapter',
      },
    ],
  },
  {
    id: 'hog-seattle-dealer',
    name: 'Emerald City Harley-Davidson',
    description: 'Seattle area Harley-Davidson dealership',
    address: '1357 Pike St',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    latitude: 47.6062,
    longitude: -122.3321,
    phone: '(206) 555-4000',
    email: 'info@emeraldcityhd.com',
    website: 'https://emeraldcityhd.com',
    services: ['Sales', 'Service', 'Parts', 'Customization', 'Apparel'],
    clubAssociations: [
      {
        id: 'hog-seattle-dealer-1',
        clubId: 'hog',
        clubName: 'HOG (Harley Owners Group)',
        relationship: 'Official HOG Dealership',
        details: 'Home dealership for Emerald City HOG chapter',
      },
    ],
  },
  {
    id: 'austin-performance',
    name: 'Austin Performance Garage',
    description: 'Full-service performance and custom shop',
    address: '910 Congress Ave',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    latitude: 30.2672,
    longitude: -97.7431,
    phone: '(512) 555-5000',
    email: 'info@austinperformance.com',
    website: 'https://austinperformance.com',
    services: ['Performance Tuning', 'Custom Builds', 'Repairs', 'Dyno Testing'],
    clubAssociations: [
      {
        id: 'austin-perf-1',
        clubId: 'final-call',
        clubName: 'Final Call',
        relationship: 'Preferred Vendor',
        details: '15% discount for Final Call members on labor',
      },
      {
        id: 'austin-perf-2',
        clubId: 'veterans-garage',
        clubName: 'Veterans Garage',
        relationship: 'Partner Shop',
        details: 'Provides workspace and tools for Veterans Garage events',
      },
    ],
  },
  {
    id: 'phoenix-classic',
    name: 'Phoenix Classic Restorations',
    description: 'Specializing in classic car and motorcycle restoration',
    address: '3690 E Van Buren St',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85008',
    latitude: 33.4484,
    longitude: -112.0740,
    phone: '(602) 555-6000',
    email: 'info@phoenixclassic.com',
    website: 'https://phoenixclassic.com',
    services: ['Restoration', 'Paint & Body', 'Upholstery', 'Engine Rebuilds'],
    clubAssociations: [
      {
        id: 'phoenix-classic-1',
        clubId: 'veterans-garage',
        clubName: 'Veterans Garage',
        relationship: 'Partner Shop',
        details: 'Hosts monthly Veterans Garage meetups and provides mentorship',
      },
    ],
  },
  {
    id: 'miami-motors',
    name: 'Miami Motors & Customs',
    description: 'Custom motorcycle and automotive shop',
    address: '7890 Ocean Dr',
    city: 'Miami',
    state: 'FL',
    zipCode: '33139',
    latitude: 25.7617,
    longitude: -80.1918,
    phone: '(305) 555-7000',
    email: 'info@miamimotors.com',
    website: 'https://miamimotors.com',
    services: ['Custom Builds', 'Repairs', 'Performance Parts', 'Detailing'],
    clubAssociations: [
      {
        id: 'miami-motors-1',
        clubId: 'veterans-garage',
        clubName: 'Veterans Garage',
        relationship: 'Official Shop',
        details: 'Primary location for Veterans Garage Miami chapter activities',
      },
      {
        id: 'miami-motors-2',
        clubId: 'combat-customs',
        clubName: 'Combat Customs',
        relationship: 'Preferred Vendor',
        details: '10% discount on parts for Combat Customs members',
      },
    ],
  },
  {
    id: 'dallas-speed',
    name: 'Dallas Speed & Custom',
    description: 'High-performance builds and racing preparation',
    address: '4521 Commerce St',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75226',
    latitude: 32.7767,
    longitude: -96.7970,
    phone: '(214) 555-8000',
    email: 'info@dallasspeed.com',
    website: 'https://dallasspeed.com',
    services: ['Performance Builds', 'Racing Prep', 'Dyno Tuning', 'Fabrication'],
    clubAssociations: [
      {
        id: 'dallas-speed-1',
        clubId: 'final-call',
        clubName: 'Final Call',
        relationship: 'Preferred Vendor',
        details: 'Discounted rates for Final Call Dallas chapter members',
      },
    ],
  },
];

export default function Shops() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(SHOP_SERVICE_VALUES));
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateShopModalOpen, setIsCreateShopModalOpen] = useState(false);

  // Fetch clubs from database
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        const { data: clubsData } = await client.models.Club.list({
          selectionSet: ['id', 'name', 'type', 'description'],
          authMode,
          filter: { approved: { eq: true } }
        });
        
        setClubs(clubsData || []);
        // Initialize all clubs as selected
        if (clubsData && clubsData.length > 0) {
          setSelectedClubIds(new Set(clubsData.map(club => club.id)));
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setClubs([]);
      }
    };
    
    fetchClubs();
  }, [authStatus]);

  const handleClubToggle = (clubId: string) => {
    setSelectedClubIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clubId)) {
        newSet.delete(clubId);
      } else {
        newSet.add(clubId);
      }
      return newSet;
    });
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(service)) {
        newSet.delete(service);
      } else {
        newSet.add(service);
      }
      return newSet;
    });
  };

  const filteredShops = useMemo(() => {
    return mockShops.filter((shop) => {
      // Filter by club associations
      const matchesClub = shop.clubAssociations.some((association) =>
        selectedClubIds.has(association.clubId)
      );
      
      // Filter by services (if shop has any of the selected services)
      const matchesService = selectedServices.size === 0 || 
        shop.services?.some((service) => {
          // Convert service to enum format for comparison
          const enumService = service.replace(/ /g, '_').replace(/&/g, 'And');
          return selectedServices.has(enumService);
        });
      
      return matchesClub && matchesService;
    });
  }, [selectedClubIds, selectedServices]);

  const mapLocations = useMemo(() => {
    return filteredShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      lat: shop.latitude,
      lng: shop.longitude,
      type: 'shop' as const,
      description: shop.description,
    }));
  }, [filteredShops]);

  const handleMarkerClick = (shopId: string) => {
    setSelectedShopId(shopId);
    setIsModalOpen(true);
  };

  const selectedShop = useMemo(() => {
    return mockShops.find((shop) => shop.id === selectedShopId) || null;
  }, [selectedShopId]);

  const handleCreateShopSuccess = () => {
    // Shop creation successful - no need to refetch since shops need approval
    // The shop won't appear until an admin approves it
  };

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <ContentWithSidebar
      sidebar={
        <div className="space-y-6">
          {isAuthenticated && (
            <Button onClick={() => setIsCreateShopModalOpen(true)} className="w-full">
              Add Shop
            </Button>
          )}
          
          <ShopServiceFilter
            services={SHOP_SERVICE_VALUES}
            selectedServices={selectedServices}
            onServiceToggle={handleServiceToggle}
            serviceDescriptions={SHOP_SERVICE_DESCRIPTIONS}
          />
          
          <ClubFilter
            clubs={clubs}
            showSearch={true}
            selectedClubIds={selectedClubIds}
            onClubToggle={handleClubToggle}
            clubFilterTitle="Filter by Club Association"
            allClubsLabel="All Shops"
          />
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Find a Shop</h1>
          <p className="text-muted-foreground mt-2">
            Discover veteran-friendly shops and garages with club associations.
            Click on a map marker to view shop details and club affiliations.
          </p>
        </div>

        <Map locations={mapLocations} onMarkerClick={handleMarkerClick} />

        <div className="text-sm text-muted-foreground">
          Showing {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''}
        </div>
      </div>

      <ShopModal
        shop={selectedShop}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <CreateShopModal
        open={isCreateShopModalOpen}
        onOpenChange={setIsCreateShopModalOpen}
        onSuccess={handleCreateShopSuccess}
      />
    </ContentWithSidebar>
  );
}
