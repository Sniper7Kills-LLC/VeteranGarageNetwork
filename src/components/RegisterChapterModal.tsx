import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { toast } from 'sonner';
import CreateClubModal from './CreateClubModal';
import LocationPickerMap from './LocationPickerMap';

import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';

/**
 * AWS Amplify Start
 */
// Simplified Club type for props (only what we actually use)
type SimpleClub = {
  id: string;
  name: string;
};
/**
 * AWS Amplify End
 */

interface RegisterChapterModalProps {
  clubs: SimpleClub[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ChapterRole {
  roleTitle: string;
  personName: string;
  email: string;
  phone: string;
}

export default function RegisterChapterModal({
  clubs,
  open,
  onOpenChange,
  onSuccess,
}: RegisterChapterModalProps) {
  const [selectedClubId, setSelectedClubId] = useState('');
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);
  const [newClubData, setNewClubData] = useState<{ id: string; name: string; description: string; clubTypes: string[] } | null>(null);
  
  // Chapter fields
  const [chapterName, setChapterName] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [chapterWebsite, setChapterWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Chapter roles
  const [roles, setRoles] = useState<ChapterRole[]>([
    { roleTitle: '', personName: '', email: '', phone: '' }
  ]);
  
  // Admin notes
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRole = () => {
    setRoles([...roles, { roleTitle: '', personName: '', email: '', phone: '' }]);
  };

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: keyof ChapterRole, value: string) => {
    const newRoles = [...roles];
    newRoles[index][field] = value;
    setRoles(newRoles);
  };

  const handleCreateClubSuccess = (clubData: { id: string; name: string; description: string; clubTypes: string[] }) => {
    setNewClubData(clubData);
    setSelectedClubId(''); // Clear any selected club
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
  };

  const resetForm = () => {
    setSelectedClubId('');
    setNewClubData(null);
    setChapterName('');
    setChapterDescription('');
    setChapterWebsite('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setLatitude('');
    setLongitude('');
    setRoles([{ roleTitle: '', personName: '', email: '', phone: '' }]);
    setAdminNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedClubId && !newClubData) {
      toast.error('Please select a club or create a new one');
      return;
    }

    // Determine the club ID to use
    const clubIdToUse = selectedClubId || newClubData?.id;
    if (!clubIdToUse) {
      toast.error('Unable to determine club ID. Please try again.');
      return;
    }
    
    if (!chapterName.trim() || !city.trim() || !state.trim() || !latitude || !longitude) {
      toast.error('Please fill in all required chapter fields');
      return;
    }

    // Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid latitude and longitude values');
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
      
      // Prepare chapter data
      const chapterData: {
        clubId: string;
        name: string;
        description?: string;
        website?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        latitude: number;
        longitude: number;
        notes: string;
        owners: string[];
      } = {
        clubId: clubIdToUse,
        name: chapterName.trim(),
        latitude: lat,
        longitude: lng,
        notes: adminNotes.trim(),
        owners: [userId],
      };

      // Add optional fields
      if (chapterDescription.trim()) chapterData.description = chapterDescription.trim();
      if (chapterWebsite.trim()) chapterData.website = chapterWebsite.trim();
      if (address.trim()) chapterData.address = address.trim();
      if (city.trim()) chapterData.city = city.trim();
      if (state.trim()) chapterData.state = state.trim();
      if (zipCode.trim()) chapterData.zipCode = zipCode.trim();

      // Create the chapter in the database
      const { data: newChapter, errors: chapterErrors } = await client.models.ClubChapter.create(
        chapterData,
        { authMode: 'userPool' }
      );

      if (chapterErrors && chapterErrors.length > 0) {
        console.error('Chapter creation errors:', chapterErrors);
        const errorMessages = chapterErrors.map((e) => e.message).join('\n');
        toast.error('Failed to create chapter', {
          description: errorMessages,
          duration: 10000,
        });
        return;
      }

      if (!newChapter) {
        toast.error('Failed to create chapter. Please try again.');
        return;
      }

      // Validation regex for email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // RFC 5322 simplified

      // Create chapter roles
      const roleCreationPromises = roles
        .filter(role => role.roleTitle.trim() && role.personName.trim()) // Only create roles with required fields
        .map(async (role) => {
          const roleData: {
            chapterId: string;
            roleTitle: string;
            personName: string;
            email?: string;
            phone?: string;
          } = {
            chapterId: newChapter.id,
            roleTitle: role.roleTitle.trim(),
            personName: role.personName.trim(),
          };

          // Only include email if it's valid
          const trimmedEmail = role.email.trim();
          if (trimmedEmail && emailRegex.test(trimmedEmail)) {
            roleData.email = trimmedEmail;
          }

          // Only include phone if it's not empty (PhoneInput already ensures E.164 format)
          if (role.phone) {
            roleData.phone = role.phone;
          }

          return client.models.ChapterRole.create(roleData, { authMode: 'userPool' });
        });

      // Wait for all roles to be created
      const roleResults = await Promise.all(roleCreationPromises);
      
      // Check for role creation errors
      const roleErrors = roleResults.filter(result => result.errors && result.errors.length > 0);
      if (roleErrors.length > 0) {
        console.warn('Some roles failed to create:', roleErrors);
        toast.warning('Chapter created, but some roles failed to save', {
          description: 'The chapter was created successfully, but there were issues saving some roles.',
        });
      } else {
        // Show success message
        toast.success('Chapter created successfully!', {
          description: 'Your chapter is pending admin approval. You will be notified once it is approved.',
        });
      }

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating chapter:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          console.error('GraphQL Errors:', errorWithGraphQL.errors);
          toast.error('Failed to create chapter', {
            description: errorMessages,
            duration: 10000,
          });
          return;
        }
        
        if (error.message.includes('Network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          toast.error('You must be logged in to create a chapter.');
        } else {
          toast.error('Failed to create chapter', {
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Register a Chapter</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Club Selection Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select or Create Club</h3>
              
              <div className="space-y-3">
                {newClubData ? (
                  <div className="p-4 border border-border rounded-lg bg-card">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{newClubData.name}</h4>
                        <p className="text-sm text-muted-foreground">{newClubData.description}</p>
                        {newClubData.clubTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {newClubData.clubTypes.map((type) => (
                              <span
                                key={type}
                                className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewClubData(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="club-select">Select Club</Label>
                      <select
                        id="club-select"
                        value={selectedClubId}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                        className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                      >
                        <option value="">-- Select a club --</option>
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateClubModalOpen(true)}
                      className="w-full"
                    >
                      Or Create a New Club
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Chapter Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Chapter Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="chapter-name">Chapter Name *</Label>
                  <Input
                    id="chapter-name"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="e.g., Combat Customs - San Diego"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="chapter-description">Description</Label>
                  <textarea
                    id="chapter-description"
                    value={chapterDescription}
                    onChange={(e) => setChapterDescription(e.target.value)}
                    placeholder="Enter chapter description"
                    className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[80px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="chapter-website">Website URL</Label>
                  <Input
                    id="chapter-website"
                    type="url"
                    value={chapterWebsite}
                    onChange={(e) => setChapterWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Select Location on Map</Label>
                  <LocationPickerMap onLocationSelect={handleLocationSelect} />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Zip code"
                  />
                </div>

                <div>
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 32.7157"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., -117.1611"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Chapter Roles Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Chapter Roles</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRole}>
                  Add Role
                </Button>
              </div>

              <div className="space-y-4">
                {roles.map((role, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-card space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-sm">Role {index + 1}</h4>
                      {roles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRole(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`role-title-${index}`}>Role Title</Label>
                        <Input
                          id={`role-title-${index}`}
                          value={role.roleTitle}
                          onChange={(e) => updateRole(index, 'roleTitle', e.target.value)}
                          placeholder="e.g., President"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`person-name-${index}`}>Person Name</Label>
                        <Input
                          id={`person-name-${index}`}
                          value={role.personName}
                          onChange={(e) => updateRole(index, 'personName', e.target.value)}
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={role.email}
                          onChange={(e) => updateRole(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                          pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                          title="Enter a valid email address"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`phone-${index}`}>Phone</Label>
                        <PhoneInput
                          id={`phone-${index}`}
                          value={role.phone}
                          onChange={(value) => updateRole(index, 'phone', value || '')}
                          placeholder="Enter phone number"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          International format with country code
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Approval Notes Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Admin Approval Notes</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  This section is to provide contact information and additional context to reviewers. 
                  Please provide a phone number/email to reach out to for any questions about this chapter registration.
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
            </div>

            {/* Form Actions */}
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
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateClubModal
        open={isCreateClubModalOpen}
        onOpenChange={setIsCreateClubModalOpen}
        onSuccess={handleCreateClubSuccess}
      />
    </>
  );
}
