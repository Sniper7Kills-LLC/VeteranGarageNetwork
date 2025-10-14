import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import ShopForm, { type ShopFormData } from '@/components/forms/ShopForm';
import { toast } from 'sonner';

const client = generateClient<Schema>();

interface ClubAssociation {
  id: string;
  clubId: string;
  clubName: string;
  relationship: string;
  details?: string;
}

interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  clubAssociations: ClubAssociation[];
}

interface ShopModalProps {
  shop: Shop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner?: boolean;
  onSave?: () => void;
}

export default function ShopModal({
  shop,
  open,
  onOpenChange,
  isOwner = false,
  onSave,
}: ShopModalProps) {
  const [editMode, setEditMode] = useState(false);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleSubmit = async (formData: ShopFormData) => {
    if (!shop) return;

    try {
      // Update shop
      await client.models.Shop.update({
        id: shop.id,
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
        services: formData.services && formData.services.length > 0 ? formData.services : null,
      }, { authMode: 'userPool' });

      // Delete existing club associations
      const deletePromises = shop.clubAssociations.map(assoc =>
        client.models.ClubAssociation.delete({ id: assoc.id }, { authMode: 'userPool' })
      );
      await Promise.all(deletePromises);

      // Create new club associations
      const clubAssociationPromises = (formData.clubAssociations || []).map(async (association) => {
        try {
          const { data, errors } = await client.models.ClubAssociation.create(
            {
              shopId: shop.id,
              clubId: association.clubId,
              relationship: association.relationship,
              details: association.details || undefined,
              notes: `Association updated`,
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

      await Promise.all(clubAssociationPromises);

      toast.success('Shop updated successfully!');
      setEditMode(false);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error; // Re-throw to let ShopForm handle the error display
    }
  };

  if (!shop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editMode ? 'Edit Shop' : shop.name}
          </DialogTitle>
          {!editMode && shop.description && (
            <p className="text-sm text-muted-foreground">{shop.description}</p>
          )}
        </DialogHeader>

        <div className="mt-4">
          {editMode ? (
            /* Edit Mode */
            <ShopForm
              mode="edit"
              initialData={{
                id: shop.id,
                name: shop.name,
                description: shop.description,
                address: shop.address,
                city: shop.city,
                state: shop.state,
                zipCode: shop.zipCode,
                latitude: shop.latitude,
                longitude: shop.longitude,
                phone: shop.phone,
                email: shop.email,
                website: shop.website,
                services: shop.services || [],
                clubAssociations: shop.clubAssociations.map(assoc => ({
                  clubId: assoc.clubId,
                  relationship: assoc.relationship,
                  details: assoc.details,
                })),
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Location Information */}
              {(shop.address || shop.city || shop.state || shop.zipCode) && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="text-sm text-muted-foreground">
                    {shop.address && <p>{shop.address}</p>}
                    {(shop.city || shop.state || shop.zipCode) && (
                      <p>
                        {shop.city}
                        {shop.city && (shop.state || shop.zipCode) && ', '}
                        {shop.state} {shop.zipCode}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(shop.phone || shop.email || shop.website) && (
                <div>
                  <h3 className="font-semibold mb-2">Contact</h3>
                  <div className="space-y-1 text-sm">
                    {shop.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Phone:</span>
                        <a
                          href={`tel:${shop.phone}`}
                          className="text-primary hover:underline"
                        >
                          {shop.phone}
                        </a>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <a
                          href={`mailto:${shop.email}`}
                          className="text-primary hover:underline"
                        >
                          {shop.email}
                        </a>
                      </div>
                    )}
                    {shop.website && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Website:</span>
                        <a
                          href={shop.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {shop.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              {shop.services && shop.services.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {shop.services.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Club Associations */}
              {shop.clubAssociations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Club Associations</h3>
                  <div className="space-y-3">
                    {shop.clubAssociations.map((association) => (
                      <div
                        key={association.id}
                        className="p-4 border border-border rounded-lg bg-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{association.clubName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {association.relationship}
                            </p>
                          </div>
                        </div>
                        {association.details && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {association.details}
                          </p>
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
            <Button onClick={handleEditClick}>Edit Shop</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
