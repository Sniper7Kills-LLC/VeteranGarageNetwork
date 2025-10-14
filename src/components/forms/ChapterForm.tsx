import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import LocationPickerMap from '@/components/LocationPickerMap';
import CreateClubModal from '@/components/CreateClubModal';
import { validateEmail } from '@/lib/form-utils';

interface ChapterRole {
  roleTitle: string;
  personName: string;
  email: string;
  phone: string;
}

export interface ChapterFormData {
  id?: string;
  clubId: string;
  name: string;
  description?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  roles: ChapterRole[];
  notes?: string; // Only for create mode
}

interface ChapterFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ChapterFormData>;
  clubs?: Array<{ id: string; name: string }>; // Only for create mode
  onSubmit: (data: ChapterFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ChapterForm({ mode, initialData, clubs = [], onSubmit, onCancel }: ChapterFormProps) {
  // Club selection state (create mode only)
  const [selectedClubId, setSelectedClubId] = useState(initialData?.clubId || '');
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);
  const [newClubData, setNewClubData] = useState<{ id: string; name: string; description: string; clubTypes: string[] } | null>(null);
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [latitude, setLatitude] = useState(initialData?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialData?.longitude?.toString() || '');
  const [roles, setRoles] = useState<ChapterRole[]>(
    initialData?.roles && initialData.roles.length > 0
      ? initialData.roles
      : [{ roleTitle: '', personName: '', email: '', phone: '' }]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreateClubSuccess = (clubData: { id: string; name: string; description: string; clubTypes: string[] }) => {
    setNewClubData(clubData);
    setSelectedClubId('');
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Club validation (create mode only)
    if (mode === 'create' && !selectedClubId && !newClubData) {
      newErrors.club = 'Please select a club or create a new one';
    }

    // Basic validation
    if (!name.trim() || name.length < 3) {
      newErrors.name = 'Chapter name must be at least 3 characters';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state.trim()) {
      newErrors.state = 'State is required';
    }

    // Location validation
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!latitude || !longitude || isNaN(lat) || isNaN(lng)) {
      newErrors.location = 'Please select a valid location on the map';
    }

    // Website validation (if provided)
    if (website.trim()) {
      try {
        new URL(website.trim());
      } catch {
        newErrors.website = 'Please enter a valid URL';
      }
    }

    // Email validation for roles
    roles.forEach((role, index) => {
      if (role.email.trim() && !validateEmail(role.email.trim())) {
        newErrors[`role_email_${index}`] = 'Invalid email address';
      }
    });

    // Notes validation (only for create mode)
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
      const clubIdToUse = mode === 'edit' ? initialData?.clubId! : (selectedClubId || newClubData?.id!);
      
      const formData: ChapterFormData = {
        id: initialData?.id,
        clubId: clubIdToUse,
        name: name.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim() || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        roles: roles.filter(role => role.roleTitle.trim() && role.personName.trim()),
      };

      if (mode === 'create') {
        formData.notes = notes.trim();
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${mode} chapter`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Club Selection (Create mode only) */}
        {mode === 'create' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Select or Create Club</h3>
            
            {newClubData ? (
              <div className="p-4 border border-border rounded-lg bg-card">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{newClubData.name}</h4>
                    <p className="text-sm text-muted-foreground">{newClubData.description}</p>
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
                  {errors.club && (
                    <p className="text-sm text-destructive mt-1">{errors.club}</p>
                  )}
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
        )}

        {/* Chapter Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Chapter Information</h3>
          
          <div>
            <Label htmlFor="name">
              Chapter Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Combat Customs - San Diego"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter chapter description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="website">Website URL</Label>
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

        {/* Location */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Location</h3>
          
          <div>
            <Label>
              Select Location on Map <span className="text-destructive">*</span>
            </Label>
            <LocationPickerMap
              onLocationSelect={handleLocationSelect}
              initialPosition={
                latitude && longitude
                  ? [parseFloat(latitude), parseFloat(longitude)]
                  : undefined
              }
            />
            {errors.location && (
              <p className="text-sm text-destructive mt-1">{errors.location}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state}</p>
              )}
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
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 32.7157"
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -117.1611"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Chapter Roles */}
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
                      className={errors[`role_email_${index}`] ? 'border-destructive' : ''}
                    />
                    {errors[`role_email_${index}`] && (
                      <p className="text-sm text-destructive mt-1">{errors[`role_email_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`phone-${index}`}>Phone</Label>
                    <PhoneInput
                      id={`phone-${index}`}
                      value={role.phone}
                      onChange={(value) => updateRole(index, 'phone', value || '')}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                {mode === 'create' ? 'Creating Chapter...' : 'Updating Chapter...'}
              </>
            ) : (
              mode === 'create' ? 'Submit Registration' : 'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {mode === 'create' && (
        <CreateClubModal
          open={isCreateClubModalOpen}
          onOpenChange={setIsCreateClubModalOpen}
          onSuccess={handleCreateClubSuccess}
        />
      )}
    </>
  );
}
