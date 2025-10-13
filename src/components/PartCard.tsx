import { MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Part {
  id: string;
  name: string;
  partNumber: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'For Parts';
  price: number | null;
  category: string;
  subcategory: string;
  brand: string;
  fitment: string[];
  availability: 'For Sale' | 'Veterans Only' | 'First Responders Only' | 'For Trade';
  description: string;
  location: string;
  quantity: number;
  sellerName: string;
  sellerType: 'Club' | 'Shop';
  contactInfo: string;
  images: string[];
  mainImage: string;
  datePosted: string;
  views: number;
}

interface PartCardProps {
  part: Part;
  onClick: () => void;
}

export default function PartCard({ part, onClick }: PartCardProps) {
  const conditionColors = {
    'New': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Like New': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Good': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Fair': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'For Parts': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const availabilityColors = {
    'For Sale': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Veterans Only': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'First Responders Only': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'For Trade': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  return (
    <Card
      onClick={onClick}
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Part Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={part.mainImage}
          alt={part.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge className={availabilityColors[part.availability]}>
            {part.availability}
          </Badge>
          <Badge className={conditionColors[part.condition]}>
            {part.condition}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-black/70 text-white hover:bg-black/70">
            {part.category}
          </Badge>
        </div>
        {part.images.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-black/70 text-white hover:bg-black/70">
              +{part.images.length - 1} photos
            </Badge>
          </div>
        )}
      </div>

      {/* Part Content */}
      <CardContent className="p-4 space-y-3">
        {/* Part Name and Price */}
        <div>
          <h3 className="text-lg font-bold mb-1 line-clamp-2">{part.name}</h3>
          <p className="text-sm text-muted-foreground">Part #: {part.partNumber}</p>
          <p className="text-2xl font-bold text-primary mt-2">
            {part.price ? `$${part.price.toLocaleString()}` : 'Contact for Price'}
          </p>
        </div>

        {/* Part Details */}
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Brand:</span>
            <span className="font-semibold">{part.brand}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Condition:</span>
            <span className="font-semibold">{part.condition}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>Qty: {part.quantity}</span>
          </div>
        </div>

        {/* Fitment Preview */}
        {part.fitment.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2">Fits:</p>
            <div className="flex flex-wrap gap-1">
              {part.fitment.slice(0, 2).map((vehicle, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/10"
                >
                  {vehicle}
                </Badge>
              ))}
              {part.fitment.length > 2 && (
                <Badge variant="secondary">
                  +{part.fitment.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Seller Info */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {part.sellerName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{part.sellerName}</p>
              <p className="text-xs text-muted-foreground">{part.sellerType}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{part.location}</span>
          </div>
        </div>
      </CardContent>

      {/* Request Button */}
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full font-semibold"
        >
          Request Part
        </Button>
      </CardFooter>
    </Card>
  );
}
