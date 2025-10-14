import { useState, useEffect, type FormEvent } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/ui/phone-input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import LocationPickerMap from '@/components/LocationPickerMap';
import ClubAssociationSelector from '@/components/ClubAssociationSelector';
import { SHOP_SERVICE_VALUES, SHOP_SERVICE_DESCRIPTIONS } from '@/../amplify/config/enums';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { validateEmail } from '@/lib/form-utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const client = generateClient<Schema>();

export interface ShopFormData {
  id?: string;
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
  clubAssociations?: Array<{
    clubId: string;
    relationship: string;
    details?: string;
  }>;
  notes?: string; // Only for create mode
}

interface ShopFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ShopFormData>;
  onSubmit: (data: ShopFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ShopForm({ mode, initialData, onSubmit, onCancel }: ShopFormProps) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [latitude, setLatitude] = useState(initialData?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialData?.longitude?.toString() || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(initialData?.services || [])
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // Club association state
  const [clubs, setClubs] = useState<Array<{ id: string; name: string; description: string | null; approved: boolean }>>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>(
    initialData?.clubAssociations?.map(a => a.clubId) || []
  );
  const [clubAssociations, setClubAssociations] = useState<Record<string, { relationship: string; details: string }>>(
    initialData?.clubAssociations?.reduce((acc, assoc) => ({
      ...acc,
      [assoc.clubId]: { relationship: assoc.relationship, details: assoc.details || '' }
    }), {}) || {}
  );
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [clubNextToken, setClubNextToken] = useState<string | null>(null);
  const [isLoadingMoreClubs, setIsLoadingMoreClubs] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch clubs when component mounts
  useEffect(() => {
    fetchClubs('', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search for clubs
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClubs(clubSearchQuery, false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubSearchQuery]);

  const fetchClubs = async (searchQuery: string, append: boolean) => {
    if (append) {
      setIsLoadingMoreClubs(true);
    } else {
      setLoadingClubs(true);
    }
    
    try {
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      const filter = { approved: { eq: true } };
      
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
        
        // Apply client-side filtering for search query
        let filteredClubs = formattedClubs;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          filteredClubs = formattedClubs.filter((club) => {
            return (
              club.name.toLowerCase().includes(query) ||
              (club.description && club.description.toLowerCase().includes(query))
            );
          });
        }
        
        if (append) {
          setClubs((prev) => [...prev, ...filteredClubs]);
        } else {
          setClubs(filteredClubs);
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

  const handleLoadMoreClubs = () => {
    if (clubNextToken && !isLoadingMoreClubs) {
      fetchClubs(clubSearchQuery, true);
    }
  };

  const handleClubToggle = (clubId: string) => {
    setSelectedClubIds((prev) => {
      const newSelected = prev.includes(clubId)
        ? prev.filter((id) => id !== clubId)
        : [...prev, clubId];
      
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

  const updateClubAssociation = (clubId: string, field: 'relationship' | 'details', value: string) => {
    setClubAssociations((prev) => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        [field]: value,
      },
    }));
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) => {
    setLatitude(location.lat.toString());
    setLongitude(location.lng.toString());
    if (location.address) setAddress(location.address);
    if (location.city) setCity(location.city);
    if (location.state) setState(location.state);
    if (location.zipCode) setZipCode(location.zipCode);
    setErrors(prev => ({ ...prev, location: '' }));
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

  const formatServiceLabel = (service: string): string => {
    return service.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.length < 3) {
      newErrors.name = 'Shop name must be at least 3 characters';
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!latitude || !longitude || isNaN(lat) || isNaN(lng)) {
      newErrors.location = 'Please select a valid location on the map';
    }

    if (email.trim() && !validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (website.trim()) {
      try {
        new URL(website.trim());
      } catch {
        newErrors.website = 'Please enter a valid URL';
      }
    }

    if (mode === 'create' && !notes.trim()) {
      newErrors.notes = 'Please provide contact information for admin approval';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: ShopFormData = {
        id: initialData?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        services: selectedServices.size > 0 ? Array.from(selectedServices) : undefined,
        clubAssociations: selectedClubIds
          .filter(id => clubAssociations[id]?.relationship)
          .map(id => ({
            clubId: id,
            relationship: clubAssociations[id].relationship,
            details: clubAssociations[id].details || undefined,
          })),
      };

      if (mode === 'create') {
        formData.notes = notes.trim();
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${mode} shop`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <Label htmlFor="name">
          Shop Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter shop name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Shop Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your shop"
          rows={3}
        />
      </div>

      {/* Accordion for organized sections */}
      <Accordion type="multiple" className="w-full" defaultValue={["location"]}>
        {/* Location */}
        <AccordionItem value="location">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">Location *</span>
              {latitude && longitude && (
                <span className="text-sm text-muted-foreground">(Selected)</span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <LocationPickerMap
                onLocationSelect={handleLocationSelect}
                initialPosition={
                  latitude && longitude
                    ? [parseFloat(latitude), parseFloat(longitude)]
                    : undefined
                }
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contact Information */}
        <AccordionItem value="contact">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">Contact Information</span>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={(value) => setPhone(value || '')}
                  placeholder="Enter phone number"
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
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className={errors.website ? 'border-destructive' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-destructive mt-1">{errors.website}</p>
                )}
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
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border border-border rounded-md">
                {SHOP_SERVICE_VALUES.map((service) => (
                  <div key={service} className="flex items-start space-x-2">
                    <Checkbox
                      id={`service-${service}`}
                      checked={selectedServices.has(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`service-${service}`}
                        className="text-sm font-medium leading-none cursor-pointer"
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
      </Accordion>

      {/* Admin Notes (Create mode only) */}
      {mode === 'create' && (
        <div>
          <Label htmlFor="notes">
            Admin Approval Notes <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Provide contact information and additional context for reviewers.
          </p>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your contact information and any additional context..."
            rows={4}
            className={errors.notes ? 'border-destructive' : ''}
          />
          {errors.notes && (
            <p className="text-sm text-destructive mt-1">{errors.notes}</p>
          )}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Creating Shop...' : 'Updating Shop...'}
            </>
          ) : (
            mode === 'create' ? 'Create Shop' : 'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
