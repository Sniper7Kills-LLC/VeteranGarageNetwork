import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

const client = generateClient<Schema>();

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
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  roles: ChapterRole[];
}

interface ChapterModalProps {
  chapter: ClubChapter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner?: boolean;
  onSave?: () => void;
}

export default function ChapterModal({
  chapter,
  open,
  onOpenChange,
  isOwner = false,
  onSave,
}: ChapterModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    address: '',
    city: '',
    state: '',
  });

  // Initialize form data when entering edit mode
  const handleEditClick = () => {
    setFormData({
      name: chapter?.name || '',
      description: chapter?.description || '',
      website: chapter?.website || '',
      address: chapter?.address || '',
      city: chapter?.city || '',
      state: chapter?.state || '',
    });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      website: '',
      address: '',
      city: '',
      state: '',
    });
  };

  const handleSave = async () => {
    if (!chapter) return;

    try {
      setSaving(true);
      await client.models.ClubChapter.update({
        id: chapter.id,
        name: formData.name,
        description: formData.description || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
      });

      setEditMode(false);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Failed to update chapter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!chapter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{chapter.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{chapter.clubName}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {editMode ? (
            /* Edit Mode */
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Chapter Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter chapter name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your chapter"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>
              </div>
            </>
          ) : (
            /* View Mode */
            <>
              {/* Club Types */}
              {chapter.clubType && chapter.clubType.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Club Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {chapter.clubType.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                      >
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Information */}
              {(chapter.address || chapter.city || chapter.state) && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="text-sm text-muted-foreground">
                    {chapter.address && <p>{chapter.address}</p>}
                    {(chapter.city || chapter.state) && (
                      <p>
                        {chapter.city}
                        {chapter.city && chapter.state && ', '}
                        {chapter.state}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {chapter.description && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">
                    {chapter.description}
                  </p>
                </div>
              )}

              {/* Website */}
              {chapter.website && (
                <div>
                  <h3 className="font-semibold mb-2">Website</h3>
                  <a
                    href={chapter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {chapter.website}
                  </a>
                </div>
              )}

              {/* Chapter Roster */}
              {chapter.roles.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Chapter Roster</h3>
                  <div className="space-y-3">
                    {chapter.roles.map((role) => (
                      <div
                        key={role.id}
                        className="p-4 border border-border rounded-lg bg-card"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{role.roleTitle}</h4>
                            <p className="text-sm text-muted-foreground">
                              {role.personName}
                            </p>
                          </div>
                        </div>
                        {(role.email || role.phone) && (
                          <div className="mt-2 space-y-1 text-sm">
                            {role.email && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Email:</span>
                                <a
                                  href={`mailto:${role.email}`}
                                  className="text-primary hover:underline"
                                >
                                  {role.email}
                                </a>
                              </div>
                            )}
                            {role.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Phone:</span>
                                <a
                                  href={`tel:${role.phone}`}
                                  className="text-primary hover:underline"
                                >
                                  {role.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isOwner && (
          <DialogFooter className="mt-6">
            {editMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !formData.name}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={handleEditClick}>Edit Chapter</Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
