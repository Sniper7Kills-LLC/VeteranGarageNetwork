import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { CLUB_TYPE_DESCRIPTIONS } from '@/../amplify/config/enums';
import ClubForm, { type ClubFormData } from '@/components/forms/ClubForm';
import { toast } from 'sonner';

const client = generateClient<Schema>();

interface Club {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  approved: boolean;
}

interface ClubModalProps {
  club: Club | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner?: boolean;
  onSave?: () => void;
}

export default function ClubModal({
  club,
  open,
  onOpenChange,
  isOwner = false,
  onSave,
}: ClubModalProps) {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleSubmit = async (formData: ClubFormData) => {
    if (!club) return;

    try {
      await client.models.Club.update({
        id: club.id,
        name: formData.name,
        description: formData.description || null,
        type: formData.type || null,
      }, { authMode: 'userPool' });

      toast.success('Club updated successfully!');
      setEditMode(false);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating club:', error);
      throw error; // Re-throw to let ClubForm handle the error display
    }
  };

  const handleManageChapters = () => {
    onOpenChange(false);
    navigate('/clubs');
  };

  if (!club) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editMode ? 'Edit Club' : club.name}
          </DialogTitle>
          {!editMode && !club.approved && (
            <Badge variant="secondary" className="w-fit mt-2">
              Under Review
            </Badge>
          )}
        </DialogHeader>

        <div className="mt-4">
          {editMode ? (
            /* Edit Mode */
            <ClubForm
              mode="edit"
              initialData={{
                id: club.id,
                name: club.name,
                description: club.description || undefined,
                type: club.type as any,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : (
            /* View Mode */
            <>
              {club.type && (
                <div>
                  <h3 className="font-semibold mb-2">Club Type</h3>
                  <Badge variant="secondary">{club.type.replace(/_/g, ' ')}</Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {CLUB_TYPE_DESCRIPTIONS[club.type]}
                  </p>
                </div>
              )}

              {club.description && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">
                    {club.description}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Chapters</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage chapters and view chapter details
                </p>
                <Button
                  variant="outline"
                  onClick={handleManageChapters}
                  className="w-full"
                >
                  Manage Chapters
                </Button>
              </div>
            </>
          )}
        </div>

        {isOwner && !editMode && (
          <DialogFooter className="mt-6">
            <Button onClick={handleEditClick}>Edit Club</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
