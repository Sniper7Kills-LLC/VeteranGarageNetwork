import { MapPin, Package } from 'lucide-react';

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

interface PartListItemProps {
  part: Part;
  onClick: () => void;
}

export default function PartListItem({ part, onClick }: PartListItemProps) {
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
    <div
      onClick={onClick}
      className="border border-border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer p-4"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={part.mainImage}
            alt={part.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {part.images.length > 1 && (
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-1 rounded text-xs font-semibold bg-black/70 text-white">
                +{part.images.length - 1}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Part Info - Takes more space on desktop */}
          <div className="md:col-span-5 space-y-2">
            <div>
              <h3 className="text-lg font-bold line-clamp-1">{part.name}</h3>
              <p className="text-sm text-muted-foreground">Part #: {part.partNumber}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${availabilityColors[part.availability]}`}>
                {part.availability}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${conditionColors[part.condition]}`}>
                {part.condition}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{part.description}</p>
          </div>

          {/* Details */}
          <div className="md:col-span-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Brand:</span>
              <span className="font-semibold">{part.brand}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-semibold">{part.category}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>Qty: {part.quantity}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{part.location}</span>
            </div>
          </div>

          {/* Price and Action */}
          <div className="md:col-span-3 flex flex-col justify-between items-end">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {part.price ? `$${part.price.toLocaleString()}` : 'Contact'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{part.sellerName}</p>
              <p className="text-xs text-muted-foreground">{part.sellerType}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm whitespace-nowrap"
            >
              Request Part
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
