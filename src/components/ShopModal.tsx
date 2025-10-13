import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
}

export default function ShopModal({
  shop,
  open,
  onOpenChange,
}: ShopModalProps) {
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
      </DialogContent>
    </Dialog>
  );
}
