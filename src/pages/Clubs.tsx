import { useState, useMemo } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import Map from '@/components/Map';
import ChapterModal from '@/components/ChapterModal';
import RegisterChapterModal from '@/components/RegisterChapterModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

// Type definitions
interface Club {
  id: string;
  name: string;
  description?: string;
  clubType?: string[];
}

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

// Mock data for clubs
const mockClubs: Club[] = [
  {
    id: 'combat-customs',
    name: 'Combat Customs',
    description: 'Custom motorcycle builders and enthusiasts',
    clubType: ['Military Only', 'Public'],
  },
  {
    id: 'final-call',
    name: 'Final Call',
    description: 'Veteran motorcycle club',
    clubType: ['Military Only', 'First Responders'],
  },
  {
    id: 'hog',
    name: 'HOG (Harley Owners Group)',
    description: 'Official Harley-Davidson riding club',
    clubType: ['Public'],
  },
  {
    id: 'veterans-garage',
    name: 'Veterans Garage',
    description: 'Supporting veterans through automotive therapy',
    clubType: ['Military Only', 'Public'],
  },
];

const CLUB_TYPES = ['Public', 'First Responders', 'Military Only', 'LE Only', 'Fire Only'];

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
  },
  // Final Call Chapters
  {
    id: 'fc-austin',
    clubId: 'final-call',
    clubName: 'Final Call',
    clubType: ['Military Only', 'First Responders'],
    name: 'Final Call - Austin',
    description: 'Austin chapter of veteran riders',
    address: '910 Congress Ave',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2672,
    longitude: -97.7431,
    roles: [
      {
        id: 'fc-austin-1',
        roleTitle: 'President',
        personName: 'James Wilson',
        email: 'james.w@finalcall.org',
        phone: '(512) 555-0301',
      },
      {
        id: 'fc-austin-2',
        roleTitle: 'Vice President',
        personName: 'Patricia Brown',
        email: 'patricia.b@finalcall.org',
        phone: '(512) 555-0302',
      },
      {
        id: 'fc-austin-3',
        roleTitle: 'Treasurer',
        personName: 'David Lee',
        email: 'david.l@finalcall.org',
      },
      {
        id: 'fc-austin-4',
        roleTitle: 'Road Captain',
        personName: 'Jennifer Garcia',
        phone: '(512) 555-0304',
      },
    ],
  },
  {
    id: 'fc-dallas',
    clubId: 'final-call',
    clubName: 'Final Call',
    clubType: ['Military Only', 'First Responders'],
    name: 'Final Call - Dallas',
    description: 'Dallas-Fort Worth chapter',
    city: 'Dallas',
    state: 'TX',
    latitude: 32.7767,
    longitude: -96.7970,
    roles: [
      {
        id: 'fc-dallas-1',
        roleTitle: 'President',
        personName: 'Thomas Anderson',
        email: 'thomas.a@finalcall.org',
        phone: '(214) 555-0401',
      },
      {
        id: 'fc-dallas-2',
        roleTitle: 'Secretary',
        personName: 'Maria Rodriguez',
        email: 'maria.r@finalcall.org',
      },
    ],
  },
  // HOG Chapters
  {
    id: 'hog-denver',
    clubId: 'hog',
    clubName: 'HOG (Harley Owners Group)',
    clubType: ['Public'],
    name: 'Mile High HOG - Denver',
    description: 'Denver area Harley Owners Group',
    address: '2468 Harley Way',
    city: 'Denver',
    state: 'CO',
    latitude: 39.7392,
    longitude: -104.9903,
    roles: [
      {
        id: 'hog-denver-1',
        roleTitle: 'Director',
        personName: 'William Taylor',
        email: 'william.t@milehighhog.com',
        phone: '(303) 555-0501',
      },
      {
        id: 'hog-denver-2',
        roleTitle: 'Assistant Director',
        personName: 'Susan White',
        email: 'susan.w@milehighhog.com',
        phone: '(303) 555-0502',
      },
      {
        id: 'hog-denver-3',
        roleTitle: 'Treasurer',
        personName: 'Charles Harris',
        email: 'charles.h@milehighhog.com',
      },
      {
        id: 'hog-denver-4',
        roleTitle: 'Safety Officer',
        personName: 'Nancy Clark',
        email: 'nancy.c@milehighhog.com',
      },
    ],
  },
  {
    id: 'hog-seattle',
    clubId: 'hog',
    clubName: 'HOG (Harley Owners Group)',
    clubType: ['Public'],
    name: 'Emerald City HOG - Seattle',
    description: 'Seattle Harley Owners Group',
    address: '1357 Pike St',
    city: 'Seattle',
    state: 'WA',
    latitude: 47.6062,
    longitude: -122.3321,
    roles: [
      {
        id: 'hog-seattle-1',
        roleTitle: 'Director',
        personName: 'Richard Lewis',
        email: 'richard.l@emeraldcityhog.com',
        phone: '(206) 555-0601',
      },
      {
        id: 'hog-seattle-2',
        roleTitle: 'Secretary',
        personName: 'Karen Walker',
        email: 'karen.w@emeraldcityhog.com',
      },
      {
        id: 'hog-seattle-3',
        roleTitle: 'Activities Officer',
        personName: 'Steven Hall',
        email: 'steven.h@emeraldcityhog.com',
        phone: '(206) 555-0603',
      },
    ],
  },
  // Veterans Garage Chapters
  {
    id: 'vg-miami',
    clubId: 'veterans-garage',
    clubName: 'Veterans Garage',
    clubType: ['Military Only', 'Public'],
    name: 'Veterans Garage - Miami',
    description: 'Miami chapter providing automotive therapy for veterans',
    address: '7890 Ocean Dr',
    city: 'Miami',
    state: 'FL',
    latitude: 25.7617,
    longitude: -80.1918,
    roles: [
      {
        id: 'vg-miami-1',
        roleTitle: 'Chapter Lead',
        personName: 'Daniel Young',
        email: 'daniel.y@veteransgarage.org',
        phone: '(305) 555-0701',
      },
      {
        id: 'vg-miami-2',
        roleTitle: 'Operations Manager',
        personName: 'Michelle King',
        email: 'michelle.k@veteransgarage.org',
        phone: '(305) 555-0702',
      },
      {
        id: 'vg-miami-3',
        roleTitle: 'Volunteer Coordinator',
        personName: 'Christopher Wright',
        email: 'chris.w@veteransgarage.org',
      },
    ],
  },
  {
    id: 'vg-phoenix',
    clubId: 'veterans-garage',
    clubName: 'Veterans Garage',
    clubType: ['Military Only', 'Public'],
    name: 'Veterans Garage - Phoenix',
    description: 'Phoenix chapter supporting veterans through automotive projects',
    city: 'Phoenix',
    state: 'AZ',
    latitude: 33.4484,
    longitude: -112.0740,
    roles: [
      {
        id: 'vg-phoenix-1',
        roleTitle: 'Chapter Lead',
        personName: 'Amanda Scott',
        email: 'amanda.s@veteransgarage.org',
        phone: '(602) 555-0801',
      },
      {
        id: 'vg-phoenix-2',
        roleTitle: 'Treasurer',
        personName: 'Brian Green',
        email: 'brian.g@veteransgarage.org',
      },
    ],
  },
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
          {CLUB_TYPES.map((type) => (
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
    new Set(mockClubs.map((club) => club.id))
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
      const club = mockClubs.find((c) => c.id === chapter.clubId);
      if (!club || !club.clubType) {
        return false;
      }

      return club.clubType.some((type) => selectedClubTypes.has(type));
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
          clubs={mockClubs}
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
        clubs={mockClubs}
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        onSuccess={handleRegisterSuccess}
      />
    </ContentWithSidebar>
  );
}
