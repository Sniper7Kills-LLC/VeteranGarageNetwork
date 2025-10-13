import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map, { type MapBounds } from '@/components/Map';
import ChapterModal from '@/components/ChapterModal';
import RegisterChapterModal from '@/components/RegisterChapterModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

/**
 * AWS Amplify Start
 */
// Imports
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";

/**
 * AWS Amplify End
 */

// Import club types from centralized config
import { CLUB_TYPE_VALUES } from '@/../amplify/config/enums';

// Simplified Club type for state management
type SimpleClub = {
  id: string;
  name: string;
  type: string | null;
  createdAt: string;
  updatedAt: string;
};


function ClubsSidebar({
  clubs,
  selectedClubIds,
  onClubToggle,
  selectedClubTypes,
  onClubTypeToggle,
  isAuthenticated,
  onRegisterClick,
  clubSearchQuery,
  onClubSearchChange,
  hasMoreClubs,
  onLoadMoreClubs,
  isLoadingMoreClubs,
}: {
  clubs: SimpleClub[];
  selectedClubIds: Set<string>;
  onClubToggle: (clubId: string) => void;
  selectedClubTypes: Set<string>;
  onClubTypeToggle: (clubType: string) => void;
  isAuthenticated: boolean;
  onRegisterClick: () => void;
  clubSearchQuery: string;
  onClubSearchChange: (query: string) => void;
  hasMoreClubs: boolean;
  onLoadMoreClubs: () => void;
  isLoadingMoreClubs: boolean;
}) {
  const allClubsSelected = selectedClubIds.size === clubs.length;
  const allTypesSelected = selectedClubTypes.size === CLUB_TYPE_VALUES.length;

  const handleAllClubsToggle = () => {
    if (allClubsSelected) {
      // Deselect all
      clubs.forEach((club) => {
        if (selectedClubIds.has(club.id)) {
          onClubToggle(club.id);
        }
      });
    } else {
      // Select all
      clubs.forEach((club) => {
        if (!selectedClubIds.has(club.id)) {
          onClubToggle(club.id);
        }
      });
    }
  };

  const handleAllTypesToggle = () => {
    if (allTypesSelected) {
      // Deselect all
      CLUB_TYPE_VALUES.forEach((type) => {
        if (selectedClubTypes.has(type)) {
          onClubTypeToggle(type);
        }
      });
    } else {
      // Select all
      CLUB_TYPE_VALUES.forEach((type) => {
        if (!selectedClubTypes.has(type)) {
          onClubTypeToggle(type);
        }
      });
    }
  };

  // Helper function to format club type labels
  const formatClubType = (type: string): string => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Register Chapter Button */}
      {isAuthenticated && (
        <Button onClick={onRegisterClick} className="w-full">
          Register a Chapter
        </Button>
      )}
      {/* Filter by Club Type */}
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filter by Club Type</h3>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {/* All Types option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-types"
                checked={allTypesSelected}
                onCheckedChange={handleAllTypesToggle}
              />
              <label
                htmlFor="all-types"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                All Types
              </label>
            </div>

            <div className="border-t border-border my-2" />

            {/* Individual type filters */}
            {CLUB_TYPE_VALUES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedClubTypes.has(type)}
                  onCheckedChange={() => onClubTypeToggle(type)}
                />
                <label
                  htmlFor={`type-${type}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {formatClubType(type)}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Filter by Club */}
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filter by Club</h3>
        
        {/* Search Input */}
        <Input
          type="text"
          placeholder="Search clubs..."
          value={clubSearchQuery}
          onChange={(e) => onClubSearchChange(e.target.value)}
          className="mb-3"
        />
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {/* All Clubs option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-clubs"
                checked={allClubsSelected}
                onCheckedChange={handleAllClubsToggle}
              />
              <label
                htmlFor="all-clubs"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                All Clubs
              </label>
            </div>

            <div className="border-t border-border my-2" />

            {/* Individual club filters */}
            {clubs.map((club) => (
              <div key={club.id} className="flex items-center space-x-2">
                <Checkbox
                  id={club.id}
                  checked={selectedClubIds.has(club.id)}
                  onCheckedChange={() => onClubToggle(club.id)}
                />
                <label
                  htmlFor={club.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {club.name}
                </label>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMoreClubs && (
              <div className="pt-2">
                <Button
                  onClick={onLoadMoreClubs}
                  disabled={isLoadingMoreClubs}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoadingMoreClubs ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default function Clubs() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [allClubs, setAllClubs] = useState<SimpleClub[]>([]);
  const [clubs, setClubs] = useState<SimpleClub[]>([]);
  const [chapters, setChapters] = useState<Array<{
    id: string;
    name: string;
    description?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    latitude: number;
    longitude: number;
    clubId: string;
    club?: { name?: string; type?: string | null } | null;
    roles?: Array<{
      id: string;
      roleTitle: string;
      personName: string;
      email?: string | null;
      phone?: string | null;
    }> | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [selectedClubTypes, setSelectedClubTypes] = useState<Set<string>>(new Set(CLUB_TYPE_VALUES));
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [clubNextToken, setClubNextToken] = useState<string | null>(null);
  const [isLoadingMoreClubs, setIsLoadingMoreClubs] = useState(false);
  const [chapterNextToken, setChapterNextToken] = useState<string | null>(null);
  const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);
  const [totalChapters, setTotalChapters] = useState<number>(0);
  
  // Fetch all clubs on mount (for the filter sidebar)
  useEffect(() => {
    const fetchAllClubs = async () => {
      try {
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        const { data: clubsData } = await client.models.Club.list({
          selectionSet: ['id', 'name', 'type', 'createdAt', 'updatedAt'],
          authMode,
          filter: { approved: { eq: true } }
        });
        
        setAllClubs(clubsData || []);
        // Initialize all clubs as selected
        if (clubsData && clubsData.length > 0) {
          setSelectedClubIds(new Set(clubsData.map(club => club.id)));
        }
      } catch (error) {
        console.error('Error fetching all clubs:', error);
        setAllClubs([]);
      }
    };
    
    fetchAllClubs();
  }, [authStatus]);
  
  // Fetch filtered clubs based on club type filter and search query with pagination
  useEffect(() => {
    const fetchFilteredClubs = async () => {
      try {
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        // Build club filter
        const clubFilter: Record<string, unknown> = { approved: { eq: true } };
        
        // Add club type filter if any types are selected
        if (selectedClubTypes.size > 0) {
          const typeArray = Array.from(selectedClubTypes);
          if (typeArray.length === 1) {
            clubFilter.type = { eq: typeArray[0] };
          } else {
            clubFilter.or = typeArray.map(type => ({ type: { eq: type } }));
          }
        }
        
        // Add search filter if query exists
        if (clubSearchQuery.trim()) {
          clubFilter.name = { contains: clubSearchQuery.trim() };
        }
        
        // Fetch clubs with filter and pagination
        const response = await client.models.Club.list({
          selectionSet: ['id', 'name', 'type', 'createdAt', 'updatedAt'],
          authMode,
          filter: clubFilter,
          limit: 1000,
        });
        
        setClubs(response.data || []);
        setClubNextToken(response.nextToken || null);
        
        // Update selected clubs: keep existing selections that are still valid, and auto-select new clubs
        const filteredClubIds = new Set(response.data?.map(club => club.id) || []);
        setSelectedClubIds(prev => {
          const updated = new Set<string>();
          
          // Keep clubs that are still in the filtered list
          prev.forEach(id => {
            if (filteredClubIds.has(id)) {
              updated.add(id);
            }
          });
          
          // Auto-select any new clubs that weren't in the previous selection
          filteredClubIds.forEach(id => {
            if (!prev.has(id)) {
              updated.add(id);
            }
          });
          
          // Only update if there's a difference to avoid infinite loop
          if (updated.size !== prev.size || Array.from(updated).some(id => !prev.has(id))) {
            return updated;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error fetching filtered clubs:', error);
        setClubs([]);
        setClubNextToken(null);
      }
    };
    
    // Only fetch if we have initialized the all clubs
    if (allClubs.length > 0) {
      fetchFilteredClubs();
    }
  }, [authStatus, selectedClubTypes, clubSearchQuery, allClubs.length]);
  
  // Load more clubs handler
  const handleLoadMoreClubs = async () => {
    if (!clubNextToken || isLoadingMoreClubs) return;
    
    try {
      setIsLoadingMoreClubs(true);
      const client = generateClient<Schema>();
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      
      // Build club filter
      const clubFilter: Record<string, unknown> = { approved: { eq: true } };
      
      // Add club type filter if any types are selected
      if (selectedClubTypes.size > 0) {
        const typeArray = Array.from(selectedClubTypes);
        if (typeArray.length === 1) {
          clubFilter.type = { eq: typeArray[0] };
        } else {
          clubFilter.or = typeArray.map(type => ({ type: { eq: type } }));
        }
      }
      
      // Add search filter if query exists
      if (clubSearchQuery.trim()) {
        clubFilter.name = { contains: clubSearchQuery.trim() };
      }
      
      // Fetch next page
      const response = await client.models.Club.list({
        selectionSet: ['id', 'name', 'type', 'createdAt', 'updatedAt'],
        authMode,
        filter: clubFilter,
        limit: 1000,
        nextToken: clubNextToken,
      });
      
      // Append new clubs to existing list
      const newClubs = response.data || [];
      setClubs(prev => [...prev, ...newClubs]);
      
      // Only set nextToken if we actually got data
      setClubNextToken(newClubs.length > 0 ? (response.nextToken || null) : null);
      
      // Auto-select new clubs
      const newClubIds = newClubs.map(club => club.id);
      setSelectedClubIds(prev => {
        const updated = new Set(prev);
        newClubIds.forEach(id => updated.add(id));
        return updated;
      });
    } catch (error) {
      console.error('Error loading more clubs:', error);
    } finally {
      setIsLoadingMoreClubs(false);
    }
  };
  
  // Fetch chapters based on selected clubs and map bounds with pagination
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setIsLoading(true);
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        // Build chapter filter based on selected clubs and geographic bounds
        const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];
        
        // Add club ID filter
        if (selectedClubIds.size > 0) {
          const clubIdArray = Array.from(selectedClubIds);
          if (clubIdArray.length === 1) {
            filters.push({ clubId: { eq: clubIdArray[0] } });
          } else {
            filters.push({ 
              or: clubIdArray.map(clubId => ({ clubId: { eq: clubId } }))
            });
          }
        }
        
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
        const chapterFilter = filters.length > 1 ? { and: filters } : filters[0];
        
        // Fetch chapters with filter and pagination
        const response = await client.models.ClubChapter.list({
          selectionSet: ['id', 'name', 'description', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude', 'clubId', 'club.*', 'roles.*'],
          authMode,
          filter: chapterFilter,
          limit: 1000,
        });
        
        setChapters(response.data || []);
        setChapterNextToken(response.nextToken || null);
        
        // Fetch total count (without pagination)
        const countResponse = await client.models.ClubChapter.list({
          selectionSet: ['id'],
          authMode,
          filter: chapterFilter,
        });
        setTotalChapters(countResponse.data?.length || 0);
      } catch (error) {
        console.error('Error fetching chapters:', error);
        setChapters([]);
        setChapterNextToken(null);
        setTotalChapters(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have selected clubs and map bounds
    if (selectedClubIds.size > 0 && mapBounds) {
      fetchChapters();
    } else if (selectedClubIds.size === 0) {
      setChapters([]);
      setChapterNextToken(null);
      setTotalChapters(0);
      setIsLoading(false);
    }
  }, [authStatus, selectedClubIds, mapBounds]);
  
  // Load more chapters handler
  const handleLoadMoreChapters = async () => {
    if (!chapterNextToken || isLoadingMoreChapters) return;
    
    try {
      setIsLoadingMoreChapters(true);
      const client = generateClient<Schema>();
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      
      // Build chapter filter based on selected clubs and geographic bounds
      const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];
      
      // Add club ID filter
      if (selectedClubIds.size > 0) {
        const clubIdArray = Array.from(selectedClubIds);
        if (clubIdArray.length === 1) {
          filters.push({ clubId: { eq: clubIdArray[0] } });
        } else {
          filters.push({ 
            or: clubIdArray.map(clubId => ({ clubId: { eq: clubId } }))
          });
        }
      }
      
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
      const chapterFilter = filters.length > 1 ? { and: filters } : filters[0];
      
      // Fetch next page
      const response = await client.models.ClubChapter.list({
        selectionSet: ['id', 'name', 'description', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude', 'clubId', 'club.*', 'roles.*'],
        authMode,
        filter: chapterFilter,
        limit: 1000,
        nextToken: chapterNextToken,
      });
      
      // Append new chapters to existing list
      const newChapters = response.data || [];
      setChapters(prev => [...prev, ...newChapters]);
      
      // Only set nextToken if we actually got data
      setChapterNextToken(newChapters.length > 0 ? (response.nextToken || null) : null);
    } catch (error) {
      console.error('Error loading more chapters:', error);
    } finally {
      setIsLoadingMoreChapters(false);
    }
  };
  
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

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

  const handleClubTypeToggle = (clubType: string) => {
    setSelectedClubTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clubType)) {
        newSet.delete(clubType);
      } else {
        newSet.add(clubType);
      }
      return newSet;
    });
  };

  const mapLocations = useMemo(() => {
    return chapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      lat: chapter.latitude,
      lng: chapter.longitude,
      type: 'club' as const,
      description: chapter.description || undefined,
    }));
  }, [chapters]);

  const handleMarkerClick = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setIsModalOpen(true);
  };

  const selectedChapter = useMemo(() => {
    const chapter = chapters.find((chapter) => chapter.id === selectedChapterId);
    if (!chapter) return null;
    
    // Transform database chapter to match ChapterModal interface
    const rolesArray = Array.isArray(chapter.roles) ? chapter.roles : [];
    
    return {
      id: chapter.id,
      clubId: chapter.clubId,
      clubName: chapter.club?.name || '',
      clubType: chapter.club?.type ? [chapter.club.type] : undefined,
      name: chapter.name,
      description: chapter.description || undefined,
      address: chapter.address || undefined,
      city: chapter.city || undefined,
      state: chapter.state || undefined,
      latitude: chapter.latitude,
      longitude: chapter.longitude,
      roles: rolesArray.map((role) => ({
        id: role.id,
        roleTitle: role.roleTitle,
        personName: role.personName,
        email: role.email || undefined,
        phone: role.phone || undefined,
      })),
    };
  }, [chapters, selectedChapterId]);

  const handleRegisterSuccess = () => {
    // Refetch clubs to include any newly created clubs
    const refetchClubs = async () => {
      try {
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        const { data: clubsData } = await client.models.Club.list({
          selectionSet: ['id', 'name', 'type', 'createdAt', 'updatedAt'],
          authMode,
          filter: { approved: { eq: true } }
        });
        
        setAllClubs(clubsData || []);
        
        // Update selected clubs to include new clubs
        if (clubsData && clubsData.length > 0) {
          setSelectedClubIds(prev => {
            const updated = new Set(prev);
            clubsData.forEach(club => updated.add(club.id));
            return updated;
          });
        }
      } catch (error) {
        console.error('Error refetching clubs:', error);
      }
    };
    
    refetchClubs();
  };

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <ContentWithSidebar
      sidebar={
        <ClubsSidebar
          clubs={clubs}
          selectedClubIds={selectedClubIds}
          onClubToggle={handleClubToggle}
          selectedClubTypes={selectedClubTypes}
          onClubTypeToggle={handleClubTypeToggle}
          isAuthenticated={isAuthenticated}
          onRegisterClick={() => setIsRegisterModalOpen(true)}
          clubSearchQuery={clubSearchQuery}
          onClubSearchChange={setClubSearchQuery}
          hasMoreClubs={clubNextToken !== null}
          onLoadMoreClubs={handleLoadMoreClubs}
          isLoadingMoreClubs={isLoadingMoreClubs}
        />
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Find a Club</h1>
          <p className="text-muted-foreground mt-2">
            Explore veteran motorcycle clubs and chapters across the country.
            Click on a map marker to view chapter details and contact information.
          </p>
        </div>

        <Map 
          locations={mapLocations} 
          onMarkerClick={handleMarkerClick}
          onBoundsChange={handleBoundsChange}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading chapters...'
            ) : (
              <>
                Showing {chapters.length} of {totalChapters} chapter
                {totalChapters !== 1 ? 's' : ''}
              </>
            )}
          </div>
          
          {chapterNextToken && !isLoading && (
            <Button
              onClick={handleLoadMoreChapters}
              disabled={isLoadingMoreChapters}
              variant="outline"
              size="sm"
            >
              {isLoadingMoreChapters ? 'Loading...' : 'Load More Chapters'}
            </Button>
          )}
        </div>
      </div>

      <ChapterModal
        chapter={selectedChapter}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <RegisterChapterModal
        clubs={clubs}
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        onSuccess={handleRegisterSuccess}
      />
    </ContentWithSidebar>
  );
}
