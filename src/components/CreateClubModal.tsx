import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';
import ClubForm, { type ClubFormData } from '@/components/forms/ClubForm';

const client = generateClient<Schema>();

interface CreateClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (clubData: { id: string; name: string; description: string; clubTypes: string[] }) => void;
}

export default function CreateClubModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateClubModalProps) {
  const handleSubmit = async (formData: ClubFormData) => {
    try {
      // Get current user's identity
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Prepare club data for database
      const clubData = {
        name: formData.name,
        description: formData.description || null,
        website: formData.website || null,
        notes: formData.notes!,
        type: formData.type || null,
        owners: [userId],
      };

      // Create the club in the database
      const { data: newClub, errors } = await client.models.Club.create(
        clubData,
        { authMode: 'userPool' }
      );

      if (errors && errors.length > 0) {
        console.error('Club creation errors:', errors);
        const errorMessages = errors.map((e) => e.message).join('\n');
        throw new Error(errorMessages);
      }

      if (!newClub) {
        throw new Error('Failed to create club. Please try again.');
      }

      // Show success message
      toast.success('Club created successfully!', {
        description: 'Your club is pending admin approval. You will be notified once it is approved.',
      });

      // Pass the club data back to parent for any additional handling
      onSuccess({
        id: newClub.id,
        name: formData.name,
        description: formData.description || '',
        clubTypes: formData.type ? [formData.type] : [],
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating club:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        // Check for GraphQL errors
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          console.error('GraphQL Errors:', errorWithGraphQL.errors);
          throw new Error(errorMessages);
        }
        
        // Show detailed error message
        if (error.message.includes('Network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          throw new Error('You must be logged in to create a club.');
        }
      }
      
      // Re-throw to let ClubForm handle the error display
      throw error;
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Club</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ClubForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
