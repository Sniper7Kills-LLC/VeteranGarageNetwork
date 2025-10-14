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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { CLUB_TYPE_VALUES, CLUB_TYPE_DESCRIPTIONS, type ClubType } from '@/../amplify/config/enums';

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
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
  });

  // Initialize form data when entering edit mode
  const handleEditClick = () => {
    setFormData({
      name: club?.name || '',
      description: club?.description || '',
      type: club?.type || '',
    });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      type: '',
    });
  };

  const handleSave = async () => {
    if (!club) return;

    try {
      setSaving(true);
      await client.models.Club.update({
        id: club.id,
        name: formData.name,
        description: formData.description || null,
        type: formData.type ? (formData.type as ClubType) : null,
      });

      setEditMode(false);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating club:', error);
      alert('Failed to update club. Please try again.');
    } finally {
      setSaving(false);
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

        <div className="space-y-6 mt-4">
          {editMode ? (
            /* Edit Mode */
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter club name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Club Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                >
                  <option value="">-- Select a club type --</option>
                  {CLUB_TYPE_VALUES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {formData.type && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {CLUB_TYPE_DESCRIPTIONS[formData.type]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your club"
                  rows={4}
                />
              </div>
            </>
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
              <Button onClick={handleEditClick}>Edit Club</Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
