import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map, { type MapBounds } from '@/components/Map';
import ChapterModal from '@/components/ChapterModal';
import RegisterChapterModal from '@/components/RegisterChapterModal';
import ClubFilter from '@/components/filters/ClubFilter';
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

// Import club types from centralized config
import { CLUB_TYPE_VALUES, CLUB_TYPE_DESCRIPTIONS } from '@/../amplify/config/enums';

// Simplified Club type for state management
type SimpleClub = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

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
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'apiKey';
        
        const response = await client.queries.listApprovedClubs({
          limit: 1000
        }, { authMode });
        
        const items = response.data?.items || [];
        setAllClubs(items as SimpleClub[]);
        
        // Initialize all clubs as selected
        if (items.length > 0) {
          setSelectedClubIds(new Set(items.map((club: any) => club.id)));
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
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'apiKey';
        
        // Use secure custom query with server-side filtering
        const response = await client.queries.listApprovedClubsByType({
          types: selectedClubTypes.size > 0 ? Array.from(selectedClubTypes) : undefined,
          searchQuery: clubSearchQuery.trim() || undefined,
          limit: 1000
        }, { authMode });
        
        const items = response.data?.items || [];
        setClubs(items as SimpleClub[]);
        setClubNextToken(response.data?.nextToken || null);
        
        // Update selected clubs: keep existing selections that are still valid, and auto-select new clubs
        const filteredClubIds = new Set(items.map((club: any) => club.id));
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
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'apiKey';
      
      // Use secure custom query with pagination
      const response = await client.queries.listApprovedClubsByType({
        types: selectedClubTypes.size > 0 ? Array.from(selectedClubTypes) : undefined,
        searchQuery: clubSearchQuery.trim() || undefined,
        limit: 1000,
        nextToken: clubNextToken
      }, { authMode });
      
      // Append new clubs to existing list
      const newClubs = response.data?.items || [];
      setClubs(prev => [...prev, ...(newClubs as SimpleClub[])]);
      
      // Only set nextToken if we actually got data
      setClubNextToken(newClubs.length > 0 ? (response.data?.nextToken || null) : null);
      
      // Auto-select new clubs
      const newClubIds = newClubs.map((club: any) => club.id);
      setSelectedClubIds(prev => {
        const updated = new Set(prev);
        newClubIds.forEach((id: string) => updated.add(id));
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
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'apiKey';
        
        // Use secure custom query with server-side filtering and pipeline
        const response = await client.queries.listApprovedChapters({
          clubIds: Array.from(selectedClubIds),
          minLat: mapBounds?.southWest.lat,
          maxLat: mapBounds?.northEast.lat,
          minLng: mapBounds?.southWest.lng,
          maxLng: mapBounds?.northEast.lng,
          limit: 1000
        }, { authMode });
        
        const items = response.data?.items || [];
        setChapters(items as any);
        setChapterNextToken(response.data?.nextToken || null);
        setTotalChapters(response.data?.scannedCount || 0);
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
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'apiKey';
      
      // Use secure custom query with pagination
      const response = await client.queries.listApprovedChapters({
        clubIds: Array.from(selectedClubIds),
        minLat: mapBounds?.southWest.lat,
        maxLat: mapBounds?.northEast.lat,
        minLng: mapBounds?.southWest.lng,
        maxLng: mapBounds?.northEast.lng,
        limit: 1000,
        nextToken: chapterNextToken
      }, { authMode });
      
      // Append new chapters to existing list
      const newChapters = response.data?.items || [];
      setChapters(prev => [...prev, ...(newChapters as any)]);
      
      // Only set nextToken if we actually got data
      setChapterNextToken(newChapters.length > 0 ? (response.data?.nextToken || null) : null);
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
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'apiKey';
        
        const response = await client.queries.listApprovedClubs({
          limit: 1000
        }, { authMode });
        
        const items = response.data?.items || [];
        setAllClubs(items as SimpleClub[]);
        
        // Update selected clubs to include new clubs
        if (items.length > 0) {
          setSelectedClubIds(prev => {
            const updated = new Set(prev);
            items.forEach((club: any) => updated.add(club.id));
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
        <ClubFilter
          clubs={clubs}
          showClubTypeFilter={true}
          clubTypes={CLUB_TYPE_VALUES}
          selectedClubTypes={selectedClubTypes}
          onClubTypeToggle={handleClubTypeToggle}
          clubTypeDescriptions={CLUB_TYPE_DESCRIPTIONS}
          selectedClubIds={selectedClubIds}
          onClubToggle={handleClubToggle}
          showSearch={true}
          searchQuery={clubSearchQuery}
          onSearchChange={setClubSearchQuery}
          hasMoreClubs={clubNextToken !== null}
          onLoadMore={handleLoadMoreClubs}
          isLoadingMore={isLoadingMoreClubs}
          headerContent={
            isAuthenticated ? (
              <Button onClick={() => setIsRegisterModalOpen(true)} className="w-full">
                Register a Chapter
              </Button>
            ) : undefined
          }
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
