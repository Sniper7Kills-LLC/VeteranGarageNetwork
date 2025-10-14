import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import LocationPickerMap from '@/components/LocationPickerMap';

import { SHOP_SERVICE_VALUES, SHOP_SERVICE_DESCRIPTIONS } from '@/../amplify/config/enums';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';
import ClubAssociationSelector from '@/components/ClubAssociationSelector';
import ChapterAssociationSelector from '@/components/ChapterAssociationSelector';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CreateShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateShopModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateShopModalProps) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Club and Chapter association state
  const [clubs, setClubs] = useState<Array<{ id: string; name: string; description: string | null; approved: boolean }>>([]);
  const [chapters, setChapters] = useState<Array<{ id: string; name: string; description: string | null; clubName: string; approved: boolean }>>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [clubAssociations, setClubAssociations] = useState<Record<string, { relationship: string; details: string }>>({});
  const [chapterAssociations, setChapterAssociations] = useState<Record<string, { relationship: string; details: string }>>({});
  
  // Search and pagination state
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [clubNextToken, setClubNextToken] = useState<string | null>(null);
  const [chapterNextToken, setChapterNextToken] = useState<string | null>(null);
  const [isLoadingMoreClubs, setIsLoadingMoreClubs] = useState(false);
  const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);

  const resetForm = () => {
    setShopName('');
    setShopDescription('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setLatitude(null);
    setLongitude(null);
    setPhone('');
    setEmail('');
    setWebsite('');
    setSelectedServices(new Set());
    setAdminNotes('');
    setSelectedClubIds([]);
    setSelectedChapterIds([]);
    setClubAssociations({});
    setChapterAssociations({});
    setClubSearchQuery('');
    setChapterSearchQuery('');
    setClubNextToken(null);
    setChapterNextToken(null);
  };

  // Fetch clubs and chapters when modal opens
  useEffect(() => {
    if (open) {
      fetchClubs('', false);
      fetchChapters('', false);
    }
  }, [open]);

  // Debounced search for clubs
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      fetchClubs(clubSearchQuery, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [clubSearchQuery, open]);

  // Debounced search for chapters
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      fetchChapters(chapterSearchQuery, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [chapterSearchQuery, open]);

  const fetchClubs = async (searchQuery: string, append: boolean) => {
    if (append) {
      setIsLoadingMoreClubs(true);
    } else {
      setLoadingClubs(true);
    }
    
    try {
      const client = generateClient<Schema>();
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      
      // Build filter
      const filters: Array<Record<string, unknown>> = [{ approved: { eq: true } }];
      
      if (searchQuery.trim()) {
        filters.push({
          or: [
            { name: { contains: searchQuery.trim() } },
            { description: { contains: searchQuery.trim() } }
          ]
        });
      }
      
      const filter = filters.length > 1 ? { and: filters } : filters[0];
      
      const response = await client.models.Club.list({
        selectionSet: ['id', 'name', 'description', 'approved'],
        authMode,
        filter,
        limit: 50,
        nextToken: append ? clubNextToken : undefined,
      });
      
      if (response.data) {
        const formattedClubs = response.data.map((club) => ({
          id: club.id,
          name: club.name,
          description: club.description,
          approved: true,
        }));
        
        if (append) {
          setClubs((prev) => [...prev, ...formattedClubs]);
        } else {
          setClubs(formattedClubs);
        }
        
        setClubNextToken(response.nextToken || null);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      if (!append) {
        toast.error('Failed to load clubs');
      }
    } finally {
      setLoadingClubs(false);
      setIsLoadingMoreClubs(false);
    }
  };

  const fetchChapters = async (searchQuery: string, append: boolean) => {
    if (append) {
      setIsLoadingMoreChapters(true);
    } else {
      setLoadingChapters(true);
    }
    
    try {
      const client = generateClient<Schema>();
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      
      // Only filter by approved status in the GraphQL query
      // We'll do client-side filtering for search to include club name
      const filter = { approved: { eq: true } };
      
      const response = await client.models.ClubChapter.list({
        selectionSet: ['id', 'name', 'description', 'clubId', 'approved', 'club.name'],
        authMode,
        filter,
        limit: 50,
        nextToken: append ? chapterNextToken : undefined,
      });
      
      if (response.data) {
        const formattedChapters = response.data.map((chapter) => ({
          id: chapter.id,
          name: chapter.name,
          description: chapter.description,
          clubName: chapter.club?.name || 'Unknown Club',
          approved: true,
        }));
        
        // Apply client-side filtering for search query
        let filteredChapters = formattedChapters;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          filteredChapters = formattedChapters.filter((chapter) => {
            return (
              chapter.name.toLowerCase().includes(query) ||
              (chapter.description && chapter.description.toLowerCase().includes(query)) ||
              chapter.clubName.toLowerCase().includes(query)
            );
          });
        }
        
        if (append) {
          setChapters((prev) => [...prev, ...filteredChapters]);
        } else {
          setChapters(filteredChapters);
        }
        
        setChapterNextToken(response.nextToken || null);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      if (!append) {
        toast.error('Failed to load chapters');
      }
    } finally {
      setLoadingChapters(false);
      setIsLoadingMoreChapters(false);
    }
  };

  const handleLoadMoreClubs = () => {
    if (clubNextToken && !isLoadingMoreClubs) {
      fetchClubs(clubSearchQuery, true);
    }
  };

  const handleLoadMoreChapters = () => {
    if (chapterNextToken && !isLoadingMoreChapters) {
      fetchChapters(chapterSearchQuery, true);
    }
  };

  const handleClubToggle = (clubId: string) => {
    setSelectedClubIds((prev) => {
      const newSelected = prev.includes(clubId)
        ? prev.filter((id) => id !== clubId)
        : [...prev, clubId];
      
      // Initialize or remove associations
      if (newSelected.includes(clubId) && !clubAssociations[clubId]) {
        setClubAssociations((prevAssoc) => ({
          ...prevAssoc,
          [clubId]: { relationship: '', details: '' },
        }));
      } else if (!newSelected.includes(clubId)) {
        setClubAssociations((prevAssoc) => {
          const newAssoc = { ...prevAssoc };
          delete newAssoc[clubId];
          return newAssoc;
        });
      }
      
      return newSelected;
    });
  };

  const handleChapterToggle = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const newSelected = prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId];
      
      // Initialize or remove associations
      if (newSelected.includes(chapterId) && !chapterAssociations[chapterId]) {
        setChapterAssociations((prevAssoc) => ({
          ...prevAssoc,
          [chapterId]: { relationship: '', details: '' },
        }));
      } else if (!newSelected.includes(chapterId)) {
        setChapterAssociations((prevAssoc) => {
          const newAssoc = { ...prevAssoc };
          delete newAssoc[chapterId];
          return newAssoc;
        });
      }
      
      return newSelected;
    });
  };

  const updateClubAssociation = (clubId: string, field: 'relationship' | 'details', value: string) => {
    setClubAssociations((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        [field]: value,
      },
    }));
  };

  const updateChapterAssociation = (chapterId: string, field: 'relationship' | 'details', value: string) => {
    setChapterAssociations((prev) => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        [field]: value,
      },
    }));
  };

  // Helper function to format service labels
  const formatServiceLabel = (service: string): string => {
    return service.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) => {
    setLatitude(location.lat);
    setLongitude(location.lng);
    if (location.address) setAddress(location.address);
    if (location.city) setCity(location.city);
    if (location.state) setState(location.state);
    if (location.zipCode) setZipCode(location.zipCode);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim()) {
      toast.error('Please enter a shop name');
      return;
    }

    if (latitude === null || longitude === null) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!adminNotes.trim()) {
      toast.error('Please provide contact information in the admin approval notes');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user's identity
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const client = generateClient<Schema>();
      
      // Prepare shop data - matching pattern from CreateClubModal
      const shopData: {
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
        notes: string;
        owners: string[];
      } = {
        name: shopName.trim(),
        description: shopDescription.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        latitude,
        longitude,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        services: selectedServices.size > 0 ? Array.from(selectedServices) : undefined,
        notes: adminNotes.trim(),
        owners: [userId],
      };

      // Create the shop in the database
      const { data: newShop, errors } = await client.models.Shop.create(
        shopData,
        { authMode: 'userPool' }
      );

      if (errors && errors.length > 0) {
        console.error('Shop creation errors:', errors);
        console.error('Full errors object:', JSON.stringify(errors, null, 2));
        
        // Display detailed error messages from Amplify response
        const errorMessages = errors.map((e) => e.message).join('\n');
        toast.error('Failed to create shop', {
          description: errorMessages,
          duration: 10000,
        });
        return;
      }

      if (!newShop) {
        toast.error('Failed to create shop. Please try again.');
        return;
      }

      // Create club associations if any are selected
      const clubAssociationPromises = selectedClubIds.map(async (clubId) => {
        const association = clubAssociations[clubId];
        if (!association.relationship) {
          console.warn(`Skipping club association for ${clubId} - no relationship type specified`);
          return null;
        }

        try {
          const { data, errors } = await client.models.ClubAssociation.create(
            {
              shopId: newShop.id,
              clubId,
              relationship: association.relationship,
              details: association.details || undefined,
              notes: `Association created during shop creation`,
            },
            { authMode: 'userPool' }
          );

          if (errors && errors.length > 0) {
            console.error(`Error creating club association for ${clubId}:`, errors);
            return null;
          }

          return data;
        } catch (error) {
          console.error(`Error creating club association for ${clubId}:`, error);
          return null;
        }
      });

      // Create chapter associations if any are selected
      const chapterAssociationPromises = selectedChapterIds.map(async (chapterId) => {
        const association = chapterAssociations[chapterId];
        if (!association.relationship) {
          console.warn(`Skipping chapter association for ${chapterId} - no relationship type specified`);
          return null;
        }

        try {
          const { data, errors } = await client.models.ChapterAssociation.create(
            {
              shopId: newShop.id,
              chapterId,
              relationship: association.relationship,
              details: association.details || undefined,
              notes: `Association created during shop creation`,
            },
            { authMode: 'userPool' }
          );

          if (errors && errors.length > 0) {
            console.error(`Error creating chapter association for ${chapterId}:`, errors);
            return null;
          }

          return data;
        } catch (error) {
          console.error(`Error creating chapter association for ${chapterId}:`, error);
          return null;
        }
      });

      // Wait for all associations to be created
      const clubResults = await Promise.all(clubAssociationPromises);
      const chapterResults = await Promise.all(chapterAssociationPromises);

      const successfulClubAssociations = clubResults.filter((r) => r !== null).length;
      const successfulChapterAssociations = chapterResults.filter((r) => r !== null).length;

      // Show success message with association info
      let description = 'Your shop is pending admin approval.';
      if (successfulClubAssociations > 0 || successfulChapterAssociations > 0) {
        description += ` ${successfulClubAssociations} club and ${successfulChapterAssociations} chapter associations were created and are also pending approval.`;
      }

      toast.success('Shop created successfully!', {
        description,
        duration: 5000,
      });

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating shop:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Handle specific error types
      if (error instanceof Error) {
        // Check for GraphQL errors (these contain detailed authorization/validation errors)
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          console.error('GraphQL Errors:', errorWithGraphQL.errors);
          toast.error('Failed to create shop', {
            description: errorMessages,
            duration: 10000,
          });
          return;
        }
        
        // Show detailed error message
        if (error.message.includes('Network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          toast.error('You must be logged in to create a shop.');
        } else {
          toast.error('Failed to create shop', {
            description: error.message,
            duration: 10000,
          });
        }
      } else {
        toast.error('An unexpected error occurred', {
          description: String(error),
          duration: 10000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Shop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div>
            <Label htmlFor="shop-name">Shop Name *</Label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
              required
            />
          </div>

          <div>
            <Label htmlFor="shop-description">Shop Description</Label>
            <textarea
              id="shop-description"
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Enter shop description"
              className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[100px]"
            />
          </div>

          {/* Accordion for Location, Contact, Services and Associations */}
          <Accordion type="multiple" className="w-full" defaultValue={["location"]}>
            {/* Location */}
            <AccordionItem value="location">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">Location *</span>
                  {latitude !== null && longitude !== null && (
                    <span className="text-sm text-muted-foreground">
                      (Selected)
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Click on the map to select your shop's location. Address details will be auto-filled.
                  </p>
                  
                  <LocationPickerMap onLocationSelect={handleLocationSelect} />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  {latitude !== null && longitude !== null && (
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Contact Information */}
            <AccordionItem value="contact">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">Contact Information</span>
                  <span className="text-sm text-muted-foreground">(Optional)</span>
                  {(phone || email || website) && (
                    <span className="text-sm text-muted-foreground">
                      - {[phone, email, website].filter(Boolean).length} filled
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="shop@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Services */}
            <AccordionItem value="services">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">Services Offered</span>
                  {selectedServices.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({selectedServices.size} selected)
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Select all services that your shop provides
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border border-border rounded-md">
                    {SHOP_SERVICE_VALUES.map((service) => (
                      <div key={service} className="flex items-start space-x-2">
                        <Checkbox
                          id={`create-shop-service-${service}`}
                          checked={selectedServices.has(service)}
                          onCheckedChange={() => handleServiceToggle(service)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`create-shop-service-${service}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {formatServiceLabel(service)}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {SHOP_SERVICE_DESCRIPTIONS[service]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Club Associations */}
            <AccordionItem value="clubs">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">Club Associations</span>
                  <span className="text-sm text-muted-foreground">(Optional)</span>
                  {selectedClubIds.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      - {selectedClubIds.length} selected
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2">
                  <ClubAssociationSelector
                    clubs={clubs}
                    selectedClubIds={selectedClubIds}
                    clubAssociations={clubAssociations}
                    onClubToggle={handleClubToggle}
                    onUpdateAssociation={updateClubAssociation}
                    searchQuery={clubSearchQuery}
                    onSearchChange={setClubSearchQuery}
                    isLoading={loadingClubs}
                    hasMore={clubNextToken !== null}
                    onLoadMore={handleLoadMoreClubs}
                    isLoadingMore={isLoadingMoreClubs}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Chapter Associations */}
            <AccordionItem value="chapters">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">Chapter Associations</span>
                  <span className="text-sm text-muted-foreground">(Optional)</span>
                  {selectedChapterIds.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      - {selectedChapterIds.length} selected
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2">
                  <ChapterAssociationSelector
                    chapters={chapters}
                    selectedChapterIds={selectedChapterIds}
                    chapterAssociations={chapterAssociations}
                    onChapterToggle={handleChapterToggle}
                    onUpdateAssociation={updateChapterAssociation}
                    searchQuery={chapterSearchQuery}
                    onSearchChange={setChapterSearchQuery}
                    isLoading={loadingChapters}
                    hasMore={chapterNextToken !== null}
                    onLoadMore={handleLoadMoreChapters}
                    isLoadingMore={isLoadingMoreChapters}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Admin Notes */}
          <div>
            <Label htmlFor="admin-notes">Admin Approval Notes *</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              This section is to provide contact information and additional context to reviewers. 
              The shop will need to be approved before it appears on the map. Please provide a phone number/email to reach out to.
            </p>
            <textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter your contact information and any additional context for reviewers..."
              className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Shop'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
