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
  type: string | null | undefined;
  description: string | null | undefined;
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
  const [chapterNextToken, setChapterNextToken] = useState<string | null>(null);
  const [totalChapters, setTotalChapters] = useState<number>(0);
  
  // Fetch all clubs on mount (for the filter sidebar)
  useEffect(() => {
    const fetchAllClubs = async () => {
      try {
        const client = generateClient<Schema>();
        
        const { data: clubsData } = await client.queries.listPublicClubs({});
        
        const filteredClubs = (clubsData || [])
          .filter((club): club is NonNullable<typeof club> => club !== null)
          .map(club => ({
            id: club.id,
            name: club.name,
            type: club.type ?? null,
            description: club.description ?? null,
            createdAt: club.createdAt,
            updatedAt: club.updatedAt,
          }));
        setAllClubs(filteredClubs);
        // Initialize all clubs as selected
        if (filteredClubs && filteredClubs.length > 0) {
          setSelectedClubIds(new Set(filteredClubs.map(club => club.id)));
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
        
        // Fetch all public clubs
        const response = await client.queries.listPublicClubs({});
        
        const allPublicClubs = (response.data || [])
          .filter((club): club is NonNullable<typeof club> => club !== null)
          .map(club => ({
            id: club.id,
            name: club.name,
            type: club.type ?? null,
            description: club.description ?? null,
            createdAt: club.createdAt,
            updatedAt: club.updatedAt,
          }));
        
        // Apply client-side filtering for type and search
        let filteredClubs = allPublicClubs;
        
        // Filter by club type
        if (selectedClubTypes.size > 0 && selectedClubTypes.size < CLUB_TYPE_VALUES.length) {
          filteredClubs = filteredClubs.filter(club => 
            club.type && selectedClubTypes.has(club.type)
          );
        }
        
        // Filter by search query
        if (clubSearchQuery.trim()) {
          const query = clubSearchQuery.trim().toLowerCase();
          filteredClubs = filteredClubs.filter(club =>
            club.name.toLowerCase().includes(query) ||
            (club.description && club.description.toLowerCase().includes(query))
          );
        }
        
        setClubs(filteredClubs);
        
        // Update selected clubs: keep existing selections that are still valid, and auto-select new clubs
        const filteredClubIds = new Set(filteredClubs.map(club => club.id));
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
      }
    };
    
    // Only fetch if we have initialized the all clubs
    if (allClubs.length > 0) {
      fetchFilteredClubs();
    }
  }, [authStatus, selectedClubTypes, clubSearchQuery, allClubs.length]);
  
  // Load more clubs handler - disabled since custom queries don't support pagination
  const handleLoadMoreClubs = async () => {
    // Custom queries don't support pagination yet
    return;
  };
  
  // Fetch chapters based on selected clubs and map bounds with pagination
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setIsLoading(true);
        const client = generateClient<Schema>();
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
        
        // Fetch chapters using custom resolver with server-side filtering
        const response = await client.queries.listPublicChapters({
          clubIds: selectedClubIds.size > 0 ? Array.from(selectedClubIds) : undefined,
          minLat: mapBounds?.southWest.lat,
          maxLat: mapBounds?.northEast.lat,
          minLng: mapBounds?.southWest.lng,
          maxLng: mapBounds?.northEast.lng,
        }, { authMode });
        
        const filteredChapters = (response.data || [])
          .filter((chapter): chapter is NonNullable<typeof chapter> => chapter !== null)
          .map(chapter => ({
            id: chapter.id,
            name: chapter.name,
            description: chapter.description ?? null,
            address: chapter.address ?? null,
            city: chapter.city ?? null,
            state: chapter.state ?? null,
            zipCode: chapter.zipCode ?? null,
            latitude: chapter.latitude,
            longitude: chapter.longitude,
            clubId: chapter.clubId,
            club: null, // Custom queries don't return nested club data
            roles: null, // Custom queries don't return nested roles data
          }));
        setChapters(filteredChapters);
        setChapterNextToken(null); // Custom queries don't support pagination
        setTotalChapters(filteredChapters.length);
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
  
  // Load more chapters handler - disabled since custom queries don't support pagination
  const handleLoadMoreChapters = async () => {
    // Custom queries don't support pagination yet
    return;
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
        
        const { data: clubsData } = await client.queries.listPublicClubs({});
        
        const filteredClubs = (clubsData || [])
          .filter((club): club is NonNullable<typeof club> => club !== null)
          .map(club => ({
            id: club.id,
            name: club.name,
            type: club.type ?? null,
            description: club.description ?? null,
            createdAt: club.createdAt,
            updatedAt: club.updatedAt,
          }));
        setAllClubs(filteredClubs);
        
        // Update selected clubs to include new clubs
        if (filteredClubs && filteredClubs.length > 0) {
          setSelectedClubIds(prev => {
            const updated = new Set(prev);
            filteredClubs.forEach(club => updated.add(club.id));
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
          hasMoreClubs={false}
          onLoadMore={handleLoadMoreClubs}
          isLoadingMore={false}
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
              disabled={false}
              variant="outline"
              size="sm"
            >
              Load More Chapters
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
