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
import { toast } from 'sonner';

import { CLUB_TYPE_VALUES, type ClubType } from '@/../amplify/config/enums';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

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
  const [selectedClubType, setSelectedClubType] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setClubName('');
    setClubDescription('');
    setSelectedClubType('');
    setAdminNotes('');
  };

  // Helper function to format club type labels
  const formatClubType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clubName.trim()) {
      toast.error('Please enter a club name');
      return;
    }

    if (!adminNotes.trim()) {
      toast.error('Please provide contact information in the admin approval notes');
      return;
    }

    setIsSubmitting(true);

    try {
      const client = generateClient<Schema>();
      
      // Prepare club data
      const clubData: {
        name: string;
        description?: string;
        notes: string;
        type?: ClubType;
      } = {
        name: clubName.trim(),
        description: clubDescription.trim() || undefined,
        notes: adminNotes.trim(),
      };

      // Add club type if one is selected
      if (selectedClubType) {
        clubData.type = selectedClubType as ClubType;
      }

      // Create the club in the database
      const { data: newClub, errors } = await client.models.Club.create(
        clubData,
        { authMode: 'userPool' }
      );

      if (errors && errors.length > 0) {
        console.error('Club creation errors:', errors);
        console.error('Full errors object:', JSON.stringify(errors, null, 2));
        
        // Display detailed error messages from Amplify response
        const errorMessages = errors.map((e) => e.message).join('\n');
        toast.error('Failed to create club', {
          description: errorMessages,
          duration: 10000,
        });
        return;
      }

      if (!newClub) {
        toast.error('Failed to create club. Please try again.');
        return;
      }

      // Show success message
      toast.success('Club created successfully!', {
        description: 'Your club is pending admin approval. You will be notified once it is approved.',
      });

      // Pass the club data back to parent for any additional handling
      onSuccess({
        name: clubName,
        description: clubDescription,
        clubTypes: selectedClubType ? [selectedClubType] : [],
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating club:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Handle specific error types
      if (error instanceof Error) {
        // Check for GraphQL errors (these contain detailed authorization/validation errors)
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          console.error('GraphQL Errors:', errorWithGraphQL.errors);
          toast.error('Failed to create club', {
            description: errorMessages,
            duration: 10000, // Show for 10 seconds so user can read it
          });
          return;
        }
        
        // Show detailed error message
        if (error.message.includes('Network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          toast.error('You must be logged in to create a club.');
        } else {
          toast.error('Failed to create club', {
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
            <Label htmlFor="club-type">Club Type</Label>
            <select
              id="club-type"
              value={selectedClubType}
              onChange={(e) => setSelectedClubType(e.target.value)}
              className="w-full mt-1 p-2 border border-border rounded-md bg-background"
            >
              <option value="">-- Select a club type --</option>
              {CLUB_TYPE_VALUES.map((type) => (
                <option key={type} value={type}>
                  {formatClubType(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="admin-notes">Admin Approval Notes</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              This section is to provide contact information and additional context to reviewers. 
              The club will need to be approved before you can add chapters. Please provide a phone number/email to reach out to.
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
              {isSubmitting ? 'Creating...' : 'Create Club'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
