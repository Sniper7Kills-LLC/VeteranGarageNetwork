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
import { toast } from 'sonner';
import LocationPickerMap from '@/components/LocationPickerMap';

import { SHOP_SERVICE_VALUES, SHOP_SERVICE_DESCRIPTIONS } from '@/../amplify/config/enums';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

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
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setShopName('');
    setShopDescription('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setLatitude(null);
    setLongitude(null);
    setPhone('');
    setEmail('');
    setWebsite('');
    setSelectedServices(new Set());
    setAdminNotes('');
  };

  // Helper function to format service labels
  const formatServiceLabel = (service: string): string => {
    return service.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) => {
    setLatitude(location.lat);
    setLongitude(location.lng);
    if (location.address) setAddress(location.address);
    if (location.city) setCity(location.city);
    if (location.state) setState(location.state);
    if (location.zipCode) setZipCode(location.zipCode);
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(service)) {
        newSet.delete(service);
      } else {
        newSet.add(service);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim()) {
      toast.error('Please enter a shop name');
      return;
    }

    if (latitude === null || longitude === null) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!adminNotes.trim()) {
      toast.error('Please provide contact information in the admin approval notes');
      return;
    }

    setIsSubmitting(true);

    try {
      const client = generateClient<Schema>();
      
      // Prepare shop data
      const shopData: {
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
        notes: string;
      } = {
        name: shopName.trim(),
        latitude,
        longitude,
        notes: adminNotes.trim(),
      };

      // Add optional fields if provided
      if (shopDescription.trim()) shopData.description = shopDescription.trim();
      if (address.trim()) shopData.address = address.trim();
      if (city.trim()) shopData.city = city.trim();
      if (state.trim()) shopData.state = state.trim();
      if (zipCode.trim()) shopData.zipCode = zipCode.trim();
      if (phone.trim()) shopData.phone = phone.trim();
      if (email.trim()) shopData.email = email.trim();
      if (website.trim()) shopData.website = website.trim();
      if (selectedServices.size > 0) {
        shopData.services = Array.from(selectedServices);
      }

      // Create the shop in the database
      const { data: newShop, errors } = await client.models.Shop.create(
        shopData,
        { authMode: 'userPool' }
      );

      if (errors && errors.length > 0) {
        console.error('Shop creation errors:', errors);
        console.error('Full errors object:', JSON.stringify(errors, null, 2));
        
        // Display detailed error messages from Amplify response
        const errorMessages = errors.map((e) => e.message).join('\n');
        toast.error('Failed to create shop', {
          description: errorMessages,
          duration: 10000,
        });
        return;
      }

      if (!newShop) {
        toast.error('Failed to create shop. Please try again.');
        return;
      }

      // Show success message
      toast.success('Shop created successfully!', {
        description: 'Your shop is pending admin approval. You will be notified once it is approved.',
      });

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating shop:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Handle specific error types
      if (error instanceof Error) {
        // Check for GraphQL errors (these contain detailed authorization/validation errors)
        const errorWithGraphQL = error as Error & { errors?: Array<{ message: string }> };
        if (errorWithGraphQL.errors && Array.isArray(errorWithGraphQL.errors)) {
          const errorMessages = errorWithGraphQL.errors.map((e) => e.message).join('\n');
          console.error('GraphQL Errors:', errorWithGraphQL.errors);
          toast.error('Failed to create shop', {
            description: errorMessages,
            duration: 10000,
          });
          return;
        }
        
        // Show detailed error message
        if (error.message.includes('Network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          toast.error('You must be logged in to create a shop.');
        } else {
          toast.error('Failed to create shop', {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Shop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div>
            <Label htmlFor="shop-name">Shop Name *</Label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
              required
            />
          </div>

          <div>
            <Label htmlFor="shop-description">Shop Description</Label>
            <textarea
              id="shop-description"
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Enter shop description"
              className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[100px]"
            />
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Location *</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Click on the map to select your shop's location. Address details will be auto-filled.
              </p>
            </div>
            
            <LocationPickerMap onLocationSelect={handleLocationSelect} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>

            {latitude !== null && longitude !== null && (
              <div className="text-xs text-muted-foreground">
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Contact Information</Label>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@example.com"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Services Offered</Label>
            <p className="text-xs text-muted-foreground">
              Select all services that your shop provides
            </p>
            
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border border-border rounded-md">
              {SHOP_SERVICE_VALUES.map((service) => (
                <div key={service} className="flex items-start space-x-2">
                  <Checkbox
                    id={`service-${service}`}
                    checked={selectedServices.has(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`service-${service}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {formatServiceLabel(service)}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {SHOP_SERVICE_DESCRIPTIONS[service]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <Label htmlFor="admin-notes">Admin Approval Notes *</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              This section is to provide contact information and additional context to reviewers. 
              The shop will need to be approved before it appears on the map. Please provide a phone number/email to reach out to.
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
              {isSubmitting ? 'Creating...' : 'Create Shop'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
