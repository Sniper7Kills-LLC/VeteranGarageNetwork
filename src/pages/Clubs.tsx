import { useState, useMemo } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map from '@/components/Map';
import ChapterModal from '@/components/ChapterModal';
import RegisterChapterModal from '@/components/RegisterChapterModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

/**
 * AWS Amplify Start
 */
// Imports
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";

// Create the Client
const client = generateClient<Schema>()

//Get the Data
const { data: clubs } = await client.models.Club.list()

// Type definitions
type Club = Schema['Club']['type'];
/**
 * AWS Amplify End
 */

// Import club types from centralized config
import { CLUB_TYPE_VALUES } from '@/../amplify/config/enums';

interface ChapterRole {
  id: string;
  roleTitle: string;
  personName: string;
  email?: string;
  phone?: string;
}

interface ClubChapter {
  id: string;
  clubId: string;
  clubName: string;
  clubType?: string[];
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  roles: ChapterRole[];
}



// Mock data for club chapters
const mockChapters: ClubChapter[] = [
  // Combat Customs Chapters
  {
    id: 'cc-sd',
    clubId: 'combat-customs',
    clubName: 'Combat Customs',
    clubType: ['Military Only', 'Public'],
    name: 'Combat Customs - San Diego',
    description: 'San Diego chapter specializing in custom builds and veteran support',
    address: '1234 Custom Ave',
    city: 'San Diego',
    state: 'CA',
    latitude: 32.7157,
    longitude: -117.1611,
    roles: [
      {
        id: 'cc-sd-1',
        roleTitle: 'President',
        personName: 'John Smith',
        email: 'john.smith@combatcustoms.com',
        phone: '(619) 555-0101',
      },
      {
        id: 'cc-sd-2',
        roleTitle: 'Vice President',
        personName: 'Sarah Johnson',
        email: 'sarah.j@combatcustoms.com',
        phone: '(619) 555-0102',
      },
      {
        id: 'cc-sd-3',
        roleTitle: 'Road Captain',
        personName: 'Mike Davis',
        email: 'mike.d@combatcustoms.com',
      },
    ],
  },
  {
    id: 'cc-la',
    clubId: 'combat-customs',
    clubName: 'Combat Customs',
    clubType: ['Military Only', 'Public'],
    name: 'Combat Customs - Los Angeles',
    description: 'LA chapter focused on custom motorcycle culture',
    address: '5678 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    latitude: 34.0522,
    longitude: -118.2437,
    roles: [
      {
        id: 'cc-la-1',
        roleTitle: 'President',
        personName: 'Robert Martinez',
        email: 'robert.m@combatcustoms.com',
        phone: '(213) 555-0201',
      },
      {
        id: 'cc-la-2',
        roleTitle: 'Secretary',
        personName: 'Lisa Chen',
        email: 'lisa.c@combatcustoms.com',
      },
    ],
  }
];

function ClubsSidebar({
  clubs,
  selectedClubIds,
  onClubToggle,
  selectedClubTypes,
  onClubTypeToggle,
  isAuthenticated,
  onRegisterClick,
}: {
  clubs: Club[];
  selectedClubIds: Set<string>;
  onClubToggle: (clubId: string) => void;
  selectedClubTypes: Set<string>;
  onClubTypeToggle: (clubType: string) => void;
  isAuthenticated: boolean;
  onRegisterClick: () => void;
}) {
  const allClubsSelected = selectedClubIds.size === clubs.length;

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

  return (
    <div className="space-y-6">
      {/* Register Chapter Button */}
      {isAuthenticated && (
        <Button onClick={onRegisterClick} className="w-full">
          Register a Chapter
        </Button>
      )}
      {/* Filter by Club */}
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filter by Club</h3>
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
        </div>
      </div>

      {/* Filter by Club Type */}
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filter by Club Type</h3>
        <div className="space-y-3">
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
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Clubs() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(
    new Set(clubs?.map((club) => club.id) ?? [])
  );
  const [selectedClubTypes, setSelectedClubTypes] = useState<Set<string>>(new Set());
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

  const filteredChapters = useMemo(() => {
    return mockChapters.filter((chapter) => {
      // Filter by selected clubs
      if (!selectedClubIds.has(chapter.clubId)) {
        return false;
      }

      // Filter by club types (OR logic)
      // If no types selected, show all
      if (selectedClubTypes.size === 0) {
        return true;
      }

      // Check if the club has any of the selected types
      const club = clubs?.find((c) => c.id === chapter.clubId);
      if (!club || !club.type) {
        return false;
      }

      return selectedClubTypes.has(club.type);
    });
  }, [selectedClubIds, selectedClubTypes]);

  const mapLocations = useMemo(() => {
    return filteredChapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      lat: chapter.latitude,
      lng: chapter.longitude,
      type: 'club' as const,
      description: chapter.description,
    }));
  }, [filteredChapters]);

  const handleMarkerClick = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setIsModalOpen(true);
  };

  const selectedChapter = useMemo(() => {
    return mockChapters.find((chapter) => chapter.id === selectedChapterId) || null;
  }, [selectedChapterId]);

  const handleRegisterSuccess = () => {
    // Handle successful registration (e.g., refresh data, show toast)
    console.log('Chapter registration successful');
  };

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <ContentWithSidebar
      sidebar={
        <ClubsSidebar
          clubs={clubs ?? []}
          selectedClubIds={selectedClubIds}
          onClubToggle={handleClubToggle}
          selectedClubTypes={selectedClubTypes}
          onClubTypeToggle={handleClubTypeToggle}
          isAuthenticated={isAuthenticated}
          onRegisterClick={() => setIsRegisterModalOpen(true)}
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

        <Map locations={mapLocations} onMarkerClick={handleMarkerClick} />

        <div className="text-sm text-muted-foreground">
          Showing {filteredChapters.length} chapter
          {filteredChapters.length !== 1 ? 's' : ''}
        </div>
      </div>

      <ChapterModal
        chapter={selectedChapter}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <RegisterChapterModal
        clubs={clubs ?? []}
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        onSuccess={handleRegisterSuccess}
      />
    </ContentWithSidebar>
  );
}
