import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import ChapterForm, { type ChapterFormData } from '@/components/forms/ChapterForm';
import { toast } from 'sonner';

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
  zipCode?: string;
  latitude: number;
  longitude: number;
  roles: ChapterRole[];
  owners?: string[];
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

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleSubmit = async (formData: ChapterFormData) => {
    if (!chapter) return;

    try {
      // Update chapter - include owners to maintain authorization
      await client.models.ClubChapter.update({
        id: chapter.id,
        name: formData.name,
        description: formData.description || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        owners: chapter.owners || [], // Include owners to maintain authorization
      }, { authMode: 'userPool' });

      // Delete existing roles
      const deletePromises = chapter.roles.map(role =>
        client.models.ChapterRole.delete({ id: role.id }, { authMode: 'userPool' })
      );
      await Promise.all(deletePromises);

      // Create new roles
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const roleCreationPromises = formData.roles.map(async (role) => {
        const roleData: {
          chapterId: string;
          roleTitle: string;
          personName: string;
          email?: string;
          phone?: string;
        } = {
          chapterId: chapter.id,
          roleTitle: role.roleTitle,
          personName: role.personName,
        };

        if (role.email && emailRegex.test(role.email)) {
          roleData.email = role.email;
        }

        if (role.phone) {
          roleData.phone = role.phone;
        }

        return client.models.ChapterRole.create(roleData, { authMode: 'userPool' });
      });

      await Promise.all(roleCreationPromises);

      toast.success('Chapter updated successfully!');
      setEditMode(false);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error; // Re-throw to let ChapterForm handle the error display
    }
  };

  if (!chapter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editMode ? 'Edit Chapter' : chapter.name}
          </DialogTitle>
          {!editMode && <p className="text-sm text-muted-foreground">{chapter.clubName}</p>}
        </DialogHeader>

        <div className="mt-4">
          {editMode ? (
            /* Edit Mode */
            <ChapterForm
              mode="edit"
              initialData={{
                id: chapter.id,
                clubId: chapter.clubId,
                name: chapter.name,
                description: chapter.description,
                website: chapter.website,
                address: chapter.address,
                city: chapter.city || '',
                state: chapter.state || '',
                zipCode: chapter.zipCode,
                latitude: chapter.latitude,
                longitude: chapter.longitude,
                roles: chapter.roles.map(role => ({
                  roleTitle: role.roleTitle,
                  personName: role.personName,
                  email: role.email || '',
                  phone: role.phone || '',
                })),
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : (
            /* View Mode */
            <div className="space-y-6">
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
            </div>
          )}
        </div>

        {isOwner && !editMode && (
          <DialogFooter className="mt-6">
            <Button onClick={handleEditClick}>Edit Chapter</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
