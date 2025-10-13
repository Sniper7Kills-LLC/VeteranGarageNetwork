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
import CreateClubModal from './CreateClubModal';
import LocationPickerMap from './LocationPickerMap';

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
  const [newClubData, setNewClubData] = useState<{ name: string; description: string; clubTypes: string[] } | null>(null);
  
  // Chapter fields
  const [chapterName, setChapterName] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
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

  const handleCreateClubSuccess = (clubData: { name: string; description: string; clubTypes: string[] }) => {
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
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setLatitude('');
    setLongitude('');
    setRoles([{ roleTitle: '', personName: '', email: '', phone: '' }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedClubId && !newClubData) {
      alert('Please select a club or create a new one');
      return;
    }
    
    if (!chapterName || !city || !state || !latitude || !longitude) {
      alert('Please fill in all required chapter fields');
      return;
    }

    // Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    // For now, just show success message
    alert('Chapter registration submitted successfully! (This is a mock submission)');
    resetForm();
    onSuccess();
    onOpenChange(false);
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
                        />
                      </div>

                      <div>
                        <Label htmlFor={`phone-${index}`}>Phone</Label>
                        <Input
                          id={`phone-${index}`}
                          type="tel"
                          value={role.phone}
                          onChange={(e) => updateRole(index, 'phone', e.target.value)}
                          placeholder="(555) 555-5555"
                        />
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
                  placeholder="Enter your contact information and any additional context for reviewers..."
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[100px]"
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
              <Button type="submit">
                Submit Registration
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
