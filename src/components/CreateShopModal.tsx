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
import ShopForm, { type ShopFormData } from '@/components/forms/ShopForm';

const client = generateClient<Schema>();

interface CreateShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateShopModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateShopModalProps) {
  const handleSubmit = async (formData: ShopFormData) => {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create the shop
      const shopData = {
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        services: formData.services || null,
        notes: formData.notes!,
        owners: [userId],
      };

      const { data: newShop, errors } = await client.models.Shop.create(
        shopData,
        { authMode: 'userPool' }
      );

      if (errors && errors.length > 0) {
        const errorMessages = errors.map((e) => e.message).join('\n');
        throw new Error(errorMessages);
      }

      if (!newShop) {
        throw new Error('Failed to create shop. Please try again.');
      }

      // Create club associations
      const clubAssociationPromises = (formData.clubAssociations || []).map(async (association) => {
        try {
          const { data, errors } = await client.models.ClubAssociation.create(
            {
              shopId: newShop.id,
              clubId: association.clubId,
              relationship: association.relationship,
              details: association.details || undefined,
              notes: `Association created during shop creation`,
            },
            { authMode: 'userPool' }
          );

          if (errors && errors.length > 0) {
            console.error(`Error creating club association for ${association.clubId}:`, errors);
            return null;
          }

          return data;
        } catch (error) {
          console.error(`Error creating club association for ${association.clubId}:`, error);
          return null;
        }
      });

      const clubResults = await Promise.all(clubAssociationPromises);
      const successfulClubAssociations = clubResults.filter((r) => r !== null).length;

      let description = 'Your shop is pending admin approval.';
      if (successfulClubAssociations > 0) {
        description += ` ${successfulClubAssociations} club association(s) were created and are also pending approval.`;
      }

      toast.success('Shop created successfully!', {
        description,
        duration: 5000,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating shop:', error);
      
      if (error instanceof Error) {
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          throw new Error(errorMessages);
        }
        
        if (error.message.includes('Network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          throw new Error('You must be logged in to create a shop.');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Shop</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ShopForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
