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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { SHOP_SERVICE_VALUES } from '@/../amplify/config/enums';

const client = generateClient<Schema>();

interface ClubAssociation {
  id: string;
  clubId: string;
  clubName: string;
  relationship: string; // e.g., "Official Shop", "Partner Garage", "Preferred Vendor"
  details?: string; // e.g., "10% discount for members", "Official HOG dealership"
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
  services?: string[]; // e.g., ["Repairs", "Custom Builds", "Parts"]
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
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    services: [] as string[],
  });

  // Initialize form data when entering edit mode
  const handleEditClick = () => {
    setFormData({
      name: shop?.name || '',
      description: shop?.description || '',
      address: shop?.address || '',
      city: shop?.city || '',
      state: shop?.state || '',
      zipCode: shop?.zipCode || '',
      phone: shop?.phone || '',
      email: shop?.email || '',
      website: shop?.website || '',
      services: shop?.services || [],
    });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!shop) return;

    try {
      setSaving(true);
      await client.models.Shop.update({
        id: shop.id,
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        services: formData.services.length > 0 ? formData.services : null,
      });

      setEditMode(false);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      alert('Failed to update shop. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  if (!shop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{shop.name}</DialogTitle>
          {shop.description && (
            <p className="text-sm text-muted-foreground">{shop.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {editMode ? (
            /* Edit Mode */
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter shop name"
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
                  placeholder="Describe your shop"
                  rows={3}
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

              <div className="grid grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    placeholder="Zip"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Email address"
                  />
                </div>
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
                <Label>Services</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {SHOP_SERVICE_VALUES.map((service) => (
                    <label
                      key={service}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => toggleService(service)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {service.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* View Mode */
            <>
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
              <Button onClick={handleEditClick}>Edit Shop</Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
