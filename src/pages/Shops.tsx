import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map, { type MapBounds } from '@/components/Map';
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

// Special ID for shops with no club affiliation
const NO_AFFILIATION_ID = '__no_affiliation__';

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

export default function Shops() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(SHOP_SERVICE_VALUES));
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateShopModalOpen, setIsCreateShopModalOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [shopNextToken, setShopNextToken] = useState<string | null>(null);
  const [isLoadingMoreShops, setIsLoadingMoreShops] = useState(false);
  const [totalShops, setTotalShops] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [clubSearchQuery, setClubSearchQuery] = useState('');

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
        // Initialize all clubs as selected, including "No Affiliation"
        if (clubsData && clubsData.length > 0) {
          setSelectedClubIds(new Set([...clubsData.map(club => club.id), NO_AFFILIATION_ID]));
        } else {
          setSelectedClubIds(new Set([NO_AFFILIATION_ID]));
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setClubs([]);
      }
    };
    
    fetchClubs();
  }, [authStatus]);

  // Fetch shops from database based on map bounds
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        // Build shop filter based on map bounds
        const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];
        
        // Add geographic bounds filter if available
        if (mapBounds) {
          filters.push({
            latitude: { 
              between: [mapBounds.southWest.lat, mapBounds.northEast.lat]
            }
          });
          filters.push({
            longitude: { 
              between: [mapBounds.southWest.lng, mapBounds.northEast.lng]
            }
          });
        }
        
        // Combine all filters with AND logic
        const shopFilter = filters.length > 1 ? { and: filters } : filters[0];
        
        const { data: shopsData, nextToken } = await client.models.Shop.list({
          selectionSet: [
            'id',
            'name',
            'description',
            'address',
            'city',
            'state',
            'zipCode',
            'latitude',
            'longitude',
            'phone',
            'email',
            'website',
            'services',
            'clubAssociations.id',
            'clubAssociations.clubId',
            'clubAssociations.relationship',
            'clubAssociations.details',
            'clubAssociations.club.id',
            'clubAssociations.club.name',
          ],
          authMode,
          filter: shopFilter,
          limit: 1000,
        });
        
        // Transform the data to match our Shop interface
        const transformedShops: Shop[] = (shopsData || []).map(shop => ({
          id: shop.id,
          name: shop.name,
          description: shop.description || undefined,
          address: shop.address || undefined,
          city: shop.city || undefined,
          state: shop.state || undefined,
          zipCode: shop.zipCode || undefined,
          latitude: shop.latitude,
          longitude: shop.longitude,
          phone: shop.phone || undefined,
          email: shop.email || undefined,
          website: shop.website || undefined,
          services: shop.services?.filter((s): s is string => s !== null) || undefined,
          clubAssociations: (shop.clubAssociations || [])
            .filter(assoc => assoc.club) // Only include associations with valid club data
            .map(assoc => ({
              id: assoc.id,
              clubId: assoc.clubId,
              clubName: assoc.club?.name || 'Unknown Club',
              relationship: assoc.relationship,
              details: assoc.details || undefined,
            })),
        }));
        
        setShops(transformedShops);
        setShopNextToken(nextToken || null);
        
        // Fetch total count (without pagination)
        const countResponse = await client.models.Shop.list({
          selectionSet: ['id'],
          authMode,
          filter: shopFilter,
        });
        setTotalShops(countResponse.data?.length || 0);
      } catch (error) {
        console.error('Error fetching shops:', error);
        setShops([]);
        setShopNextToken(null);
        setTotalShops(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have map bounds
    if (mapBounds) {
      fetchShops();
    } else {
      setIsLoading(false);
    }
  }, [authStatus, mapBounds]);

  // Load more shops handler
  const handleLoadMoreShops = async () => {
    if (!shopNextToken || isLoadingMoreShops) return;
    
    try {
      setIsLoadingMoreShops(true);
      const client = generateClient<Schema>();
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      
      // Build shop filter based on map bounds
      const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];
      
      // Add geographic bounds filter if available
      if (mapBounds) {
        filters.push({
          latitude: { 
            between: [mapBounds.southWest.lat, mapBounds.northEast.lat]
          }
        });
        filters.push({
          longitude: { 
            between: [mapBounds.southWest.lng, mapBounds.northEast.lng]
          }
        });
      }
      
      // Combine all filters with AND logic
      const shopFilter = filters.length > 1 ? { and: filters } : filters[0];
      
      // Fetch next page
      const response = await client.models.Shop.list({
        selectionSet: [
          'id',
          'name',
          'description',
          'address',
          'city',
          'state',
          'zipCode',
          'latitude',
          'longitude',
          'phone',
          'email',
          'website',
          'services',
          'clubAssociations.id',
          'clubAssociations.clubId',
          'clubAssociations.relationship',
          'clubAssociations.details',
          'clubAssociations.club.id',
          'clubAssociations.club.name',
        ],
        authMode,
        filter: shopFilter,
        limit: 1000,
        nextToken: shopNextToken,
      });
      
      // Transform and append new shops to existing list
      const newShops = (response.data || []).map(shop => ({
        id: shop.id,
        name: shop.name,
        description: shop.description || undefined,
        address: shop.address || undefined,
        city: shop.city || undefined,
        state: shop.state || undefined,
        zipCode: shop.zipCode || undefined,
        latitude: shop.latitude,
        longitude: shop.longitude,
        phone: shop.phone || undefined,
        email: shop.email || undefined,
        website: shop.website || undefined,
        services: shop.services?.filter((s): s is string => s !== null) || undefined,
        clubAssociations: (shop.clubAssociations || [])
          .filter(assoc => assoc.club)
          .map(assoc => ({
            id: assoc.id,
            clubId: assoc.clubId,
            clubName: assoc.club?.name || 'Unknown Club',
            relationship: assoc.relationship,
            details: assoc.details || undefined,
          })),
      }));
      
      setShops(prev => [...prev, ...newShops]);
      
      // Only set nextToken if we actually got data
      setShopNextToken(newShops.length > 0 ? (response.nextToken || null) : null);
    } catch (error) {
      console.error('Error loading more shops:', error);
    } finally {
      setIsLoadingMoreShops(false);
    }
  };

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

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

  // Filter clubs based on search query
  const filteredClubs = useMemo(() => {
    if (!clubSearchQuery.trim()) {
      return clubs;
    }
    
    const query = clubSearchQuery.trim();
    return clubs.filter((club) => {
      return (
        club.name.includes(query) ||
        (club.description && club.description.includes(query))
      );
    });
  }, [clubs, clubSearchQuery]);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      // Filter by club associations
      const matchesClub = shop.clubAssociations.length === 0
        ? selectedClubIds.has(NO_AFFILIATION_ID) // Unaffiliated shops only show if explicitly selected
        : shop.clubAssociations.some((association) =>
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
  }, [shops, selectedClubIds, selectedServices]);

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
    return shops.find((shop) => shop.id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  const handleCreateShopSuccess = () => {
    // Shop creation successful - refetch shops to show the new shop if approved
    const fetchShops = async () => {
      try {
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        const { data: shopsData } = await client.models.Shop.list({
          selectionSet: [
            'id',
            'name',
            'description',
            'address',
            'city',
            'state',
            'zipCode',
            'latitude',
            'longitude',
            'phone',
            'email',
            'website',
            'services',
            'clubAssociations.id',
            'clubAssociations.clubId',
            'clubAssociations.relationship',
            'clubAssociations.details',
            'clubAssociations.club.id',
            'clubAssociations.club.name',
          ],
          authMode,
          filter: { approved: { eq: true } }
        });
        
        const transformedShops: Shop[] = (shopsData || []).map(shop => ({
          id: shop.id,
          name: shop.name,
          description: shop.description || undefined,
          address: shop.address || undefined,
          city: shop.city || undefined,
          state: shop.state || undefined,
          zipCode: shop.zipCode || undefined,
          latitude: shop.latitude,
          longitude: shop.longitude,
          phone: shop.phone || undefined,
          email: shop.email || undefined,
          website: shop.website || undefined,
          services: shop.services?.filter((s): s is string => s !== null) || undefined,
          clubAssociations: (shop.clubAssociations || [])
            .filter(assoc => assoc.club)
            .map(assoc => ({
              id: assoc.id,
              clubId: assoc.clubId,
              clubName: assoc.club?.name || 'Unknown Club',
              relationship: assoc.relationship,
              details: assoc.details || undefined,
            })),
        }));
        
        setShops(transformedShops);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };
    
    fetchShops();
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
            clubs={[
              { id: NO_AFFILIATION_ID, name: 'No Affiliation', type: null, description: 'Shops with no club associations' },
              ...filteredClubs
            ]}
            showSearch={true}
            searchQuery={clubSearchQuery}
            onSearchChange={setClubSearchQuery}
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

        <div className="h-[500px]">
          <Map 
            locations={mapLocations} 
            onMarkerClick={handleMarkerClick}
            onBoundsChange={handleBoundsChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading shops...'
            ) : (
              <>
                Showing {filteredShops.length} of {totalShops} shop
                {totalShops !== 1 ? 's' : ''}
              </>
            )}
          </div>
          
          {shopNextToken && !isLoading && (
            <Button
              onClick={handleLoadMoreShops}
              disabled={isLoadingMoreShops}
              variant="outline"
              size="sm"
            >
              {isLoadingMoreShops ? 'Loading...' : 'Load More Shops'}
            </Button>
          )}
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
