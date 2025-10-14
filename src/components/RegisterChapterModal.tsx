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
import ChapterForm, { type ChapterFormData } from '@/components/forms/ChapterForm';

const client = generateClient<Schema>();

type SimpleClub = {
  id: string;
  name: string;
};

interface RegisterChapterModalProps {
  clubs: SimpleClub[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RegisterChapterModal({
  clubs,
  open,
  onOpenChange,
  onSuccess,
}: RegisterChapterModalProps) {
  const handleSubmit = async (formData: ChapterFormData) => {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create the chapter
      const chapterData = {
        clubId: formData.clubId,
        name: formData.name,
        description: formData.description || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        notes: formData.notes!,
        owners: [userId],
      };

      const { data: newChapter, errors: chapterErrors } = await client.models.ClubChapter.create(
        chapterData,
        { authMode: 'userPool' }
      );

      if (chapterErrors && chapterErrors.length > 0) {
        const errorMessages = chapterErrors.map((e) => e.message).join('\n');
        throw new Error(errorMessages);
      }

      if (!newChapter) {
        throw new Error('Failed to create chapter. Please try again.');
      }

      // Create chapter roles
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const roleCreationPromises = formData.roles.map(async (role) => {
        const roleData: {
          chapterId: string;
          roleTitle: string;
          personName: string;
          email?: string;
          phone?: string;
        } = {
          chapterId: newChapter.id,
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

      const roleResults = await Promise.all(roleCreationPromises);
      const roleErrors = roleResults.filter(result => result.errors && result.errors.length > 0);
      
      if (roleErrors.length > 0) {
        toast.warning('Chapter created, but some roles failed to save', {
          description: 'The chapter was created successfully, but there were issues saving some roles.',
        });
      } else {
        toast.success('Chapter created successfully!', {
          description: 'Your chapter is pending admin approval. You will be notified once it is approved.',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating chapter:', error);
      
      if (error instanceof Error) {
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          throw new Error(errorMessages);
        }
        
        if (error.message.includes('Network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          throw new Error('You must be logged in to create a chapter.');
        }
      }
      
      throw error;
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Register a Chapter</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ChapterForm
            mode="create"
            clubs={clubs}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
