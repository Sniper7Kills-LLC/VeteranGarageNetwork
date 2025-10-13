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
import { Checkbox } from '@/components/ui/checkbox';

import { CLUB_TYPE_VALUES } from '@/../amplify/config/enums';

interface CreateClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (clubData: { name: string; description: string; clubTypes: string[] }) => void;
}

export default function CreateClubModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateClubModalProps) {
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [selectedClubTypes, setSelectedClubTypes] = useState<Set<string>>(new Set());

  const handleClubTypeToggle = (type: string) => {
    setSelectedClubTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const resetForm = () => {
    setClubName('');
    setClubDescription('');
    setSelectedClubTypes(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clubName) {
      alert('Please enter a club name');
      return;
    }

    // Pass the club data back to parent
    onSuccess({
      name: clubName,
      description: clubDescription,
      clubTypes: Array.from(selectedClubTypes),
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Club</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="club-name">Club Name *</Label>
            <Input
              id="club-name"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Enter club name"
              required
            />
          </div>

          <div>
            <Label htmlFor="club-description">Club Description</Label>
            <textarea
              id="club-description"
              value={clubDescription}
              onChange={(e) => setClubDescription(e.target.value)}
              placeholder="Enter club description"
              className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[100px]"
            />
          </div>

          <div>
            <Label>Club Types</Label>
            <div className="space-y-2 mt-2">
              {CLUB_TYPE_VALUES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`create-club-type-${type}`}
                    checked={selectedClubTypes.has(type)}
                    onCheckedChange={() => handleClubTypeToggle(type)}
                  />
                  <label
                    htmlFor={`create-club-type-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="admin-notes">Admin Approval Notes</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              This section is to provide contact information and additional context to reviewers. 
              The club will need to be approved before you can add chapters. Please provide a phone number/email to reach out to.
            </p>
            <textarea
              id="admin-notes"
              placeholder="Enter your contact information and any additional context for reviewers..."
              className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[100px]"
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
            <Button type="submit">Create Club</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
