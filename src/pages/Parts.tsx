import { useState } from 'react';
import { Search, Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import PartCard from '@/components/PartCard';
import PartListItem from '@/components/PartListItem';
import PartModal from '@/components/PartModal';

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

// Static parts data - will be replaced with Amplify data
const PARTS: Part[] = [
  {
    id: '1',
    name: 'Harley-Davidson Evolution Engine Complete',
    partNumber: 'HD-EVO-1340-92',
    condition: 'Good',
    price: 2500,
    category: 'Engine',
    subcategory: 'Complete Engine',
    brand: 'Harley-Davidson',
    fitment: ['1984-1999 Harley Softail', '1984-1999 Harley Touring', '1986-2003 Harley Sportster'],
    availability: 'For Sale',
    description: 'Complete 1340cc Evolution engine from a 1992 Softail. Runs strong with approximately 45,000 miles. Recently serviced with new gaskets and seals. Includes carburetor and all accessories. Great for restoration projects or as a spare.',
    location: 'Phoenix, AZ',
    quantity: 1,
    sellerName: 'Desert Riders MC',
    sellerType: 'Club',
    contactInfo: 'contact@desertriders.com',
    images: [
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&h=600&fit=crop',
    datePosted: 'Dec 15, 2024',
    views: 234
  },
  {
    id: '2',
    name: 'Ford Mustang 5.0L Coyote Engine Swap Kit',
    partNumber: 'FORD-COY-50-KIT',
    condition: 'New',
    price: 8500,
    category: 'Engine',
    subcategory: 'Swap Kit',
    brand: 'Ford Performance',
    fitment: ['1965-1973 Ford Mustang', '1967-1981 Ford F-Series', '1955-1957 Chevy Bel Air'],
    availability: 'Veterans Only',
    description: 'Brand new Ford Performance 5.0L Coyote engine swap kit. Includes engine, transmission adapter, motor mounts, wiring harness, and ECU. Perfect for classic car restorations. Reserved for veterans working on their dream builds.',
    location: 'Detroit, MI',
    quantity: 2,
    sellerName: 'Motor City Veterans Garage',
    sellerType: 'Shop',
    contactInfo: 'info@mcveterans.com',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    datePosted: 'Dec 20, 2024',
    views: 456
  },
  {
    id: '3',
    name: 'Vance & Hines Exhaust System - Touring',
    partNumber: 'VH-TOUR-BLK-17',
    condition: 'Like New',
    price: 650,
    category: 'Exhaust',
    subcategory: 'Full System',
    brand: 'Vance & Hines',
    fitment: ['2017-2023 Harley Touring', '2017-2023 Harley Road Glide', '2017-2023 Harley Street Glide'],
    availability: 'For Sale',
    description: 'Vance & Hines black exhaust system for Touring models. Only 2,000 miles on it. Sounds amazing and looks great. Upgraded to a different system. Includes all mounting hardware.',
    location: 'Austin, TX',
    quantity: 1,
    sellerName: 'Lone Star Customs',
    sellerType: 'Shop',
    contactInfo: 'sales@lonestar.com',
    images: [
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop',
    datePosted: 'Dec 18, 2024',
    views: 189
  },
  {
    id: '4',
    name: 'Wilwood 6-Piston Brake Kit - Front',
    partNumber: 'WIL-6POT-14',
    condition: 'New',
    price: 1200,
    category: 'Brakes',
    subcategory: 'Brake Kit',
    brand: 'Wilwood',
    fitment: ['1964-1972 Chevrolet Chevelle', '1967-1969 Chevrolet Camaro', '1968-1974 Chevrolet Nova'],
    availability: 'For Sale',
    description: 'Brand new Wilwood 6-piston front brake kit with 14" rotors. Includes calipers, rotors, brake lines, and all mounting hardware. Massive stopping power for your classic muscle car.',
    location: 'Los Angeles, CA',
    quantity: 3,
    sellerName: 'West Coast Performance',
    sellerType: 'Shop',
    contactInfo: 'orders@wcperf.com',
    images: [
      'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=800&h=600&fit=crop',
    datePosted: 'Dec 22, 2024',
    views: 312
  },
  {
    id: '5',
    name: 'Progressive Suspension 412 Series Shocks',
    partNumber: 'PROG-412-HD',
    condition: 'Good',
    price: 280,
    category: 'Suspension',
    subcategory: 'Rear Shocks',
    brand: 'Progressive Suspension',
    fitment: ['1980-2023 Harley Sportster', '1984-1999 Harley Softail'],
    availability: 'First Responders Only',
    description: 'Progressive 412 series rear shocks. Approximately 15,000 miles. Still in great working condition. Upgraded to air ride. Available to first responders only as a thank you for your service.',
    location: 'Chicago, IL',
    quantity: 1,
    sellerName: 'Windy City Riders',
    sellerType: 'Club',
    contactInfo: 'windycityriders@email.com',
    images: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop',
    datePosted: 'Dec 10, 2024',
    views: 145
  },
  {
    id: '6',
    name: 'Edelbrock Performer RPM Intake Manifold',
    partNumber: 'EDL-7501',
    condition: 'Like New',
    price: 350,
    category: 'Engine',
    subcategory: 'Intake Manifold',
    brand: 'Edelbrock',
    fitment: ['Small Block Chevy 350', 'Small Block Chevy 383', 'Small Block Chevy 400'],
    availability: 'For Sale',
    description: 'Edelbrock Performer RPM intake manifold for small block Chevy. Used for less than 500 miles on a fresh build before switching to fuel injection. Excellent condition.',
    location: 'Nashville, TN',
    quantity: 1,
    sellerName: 'Music City Motors',
    sellerType: 'Shop',
    contactInfo: 'info@musiccitymotors.com',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    datePosted: 'Dec 19, 2024',
    views: 198
  },
  {
    id: '7',
    name: 'Vintage Honda CB750 Gas Tank',
    partNumber: 'HON-CB750-TANK-72',
    condition: 'Fair',
    price: 200,
    category: 'Body',
    subcategory: 'Fuel Tank',
    brand: 'Honda',
    fitment: ['1969-1978 Honda CB750'],
    availability: 'For Trade',
    description: 'Original Honda CB750 gas tank from a 1972 model. Has some surface rust inside but structurally sound. Great for restoration. Looking to trade for CB750 side covers or other parts.',
    location: 'Seattle, WA',
    quantity: 1,
    sellerName: 'Pacific Northwest Classics',
    sellerType: 'Club',
    contactInfo: 'pnwclassics@email.com',
    images: [
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&h=600&fit=crop',
    datePosted: 'Dec 12, 2024',
    views: 167
  },
  {
    id: '8',
    name: 'S&S Super E Carburetor Kit',
    partNumber: 'SS-SUPE-KIT',
    condition: 'New',
    price: 425,
    category: 'Engine',
    subcategory: 'Carburetor',
    brand: 'S&S Cycle',
    fitment: ['1984-1992 Harley Evo Big Twin', '1988-2003 Harley Sportster'],
    availability: 'Veterans Only',
    description: 'Brand new S&S Super E carburetor kit. Never installed. Includes carburetor, manifold, air cleaner, and all necessary hardware. Perfect upgrade for your Harley. Veterans only.',
    location: 'San Diego, CA',
    quantity: 1,
    sellerName: 'Veterans Motorcycle Club SD',
    sellerType: 'Club',
    contactInfo: 'vmcsd@email.com',
    images: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop',
    datePosted: 'Dec 21, 2024',
    views: 278
  },
  {
    id: '9',
    name: 'Vintage Speedometer - Mechanical',
    partNumber: 'UNIV-SPEEDO-VTG',
    condition: 'Good',
    price: 85,
    category: 'Electrical',
    subcategory: 'Gauges',
    brand: 'Universal',
    fitment: ['Universal Fit - Motorcycles', 'Universal Fit - Classic Cars'],
    availability: 'For Sale',
    description: 'Vintage mechanical speedometer in working condition. Chrome bezel with white face. Universal fit with standard cable connection. Great for custom builds or restorations.',
    location: 'Portland, OR',
    quantity: 2,
    sellerName: 'Rose City Restorations',
    sellerType: 'Shop',
    contactInfo: 'sales@rosecityrest.com',
    images: [
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop',
    datePosted: 'Dec 16, 2024',
    views: 123
  },
  {
    id: '10',
    name: 'Holley 750 CFM Double Pumper Carburetor',
    partNumber: 'HOL-4779',
    condition: 'Like New',
    price: 550,
    category: 'Engine',
    subcategory: 'Carburetor',
    brand: 'Holley',
    fitment: ['Small Block Chevy', 'Big Block Chevy', 'Ford 351W', 'Ford 460'],
    availability: 'For Sale',
    description: 'Holley 750 CFM double pumper carburetor. Professionally rebuilt less than 1,000 miles ago. Tuned and ready to run. Perfect for high-performance street or strip applications.',
    location: 'Dallas, TX',
    quantity: 1,
    sellerName: 'Texas Speed Shop',
    sellerType: 'Shop',
    contactInfo: 'info@texasspeed.com',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    datePosted: 'Dec 23, 2024',
    views: 289
  },
  {
    id: '11',
    name: 'Leather Saddlebags - Harley Touring',
    partNumber: 'LEATH-SADD-HD',
    condition: 'Good',
    price: 300,
    category: 'Accessories',
    subcategory: 'Luggage',
    brand: 'Custom Leather',
    fitment: ['1993-2013 Harley Touring', '1993-2013 Harley Road King'],
    availability: 'For Sale',
    description: 'Quality leather saddlebags for Harley Touring models. Some wear but still in good usable condition. Quick-release mounting system included. Great for long rides.',
    location: 'Denver, CO',
    quantity: 1,
    sellerName: 'Rocky Mountain Riders',
    sellerType: 'Club',
    contactInfo: 'rmriders@email.com',
    images: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop',
    datePosted: 'Dec 14, 2024',
    views: 156
  },
  {
    id: '12',
    name: 'MSD 6AL Ignition Box',
    partNumber: 'MSD-6425',
    condition: 'New',
    price: 180,
    category: 'Electrical',
    subcategory: 'Ignition',
    brand: 'MSD',
    fitment: ['Universal - Most V8 Engines'],
    availability: 'First Responders Only',
    description: 'Brand new MSD 6AL ignition control box. Never used, still in original packaging. Provides multiple sparks for better combustion and performance. Reserved for first responders.',
    location: 'Miami, FL',
    quantity: 1,
    sellerName: 'South Florida Speed',
    sellerType: 'Shop',
    contactInfo: 'contact@sflspeed.com',
    images: [
      'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=800&h=600&fit=crop'
    ],
    mainImage: 'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=800&h=600&fit=crop',
    datePosted: 'Dec 17, 2024',
    views: 201
  }
];

const AVAILABILITY_FILTERS = ['All Parts', 'For Sale', 'Veterans Only', 'First Responders Only', 'For Trade'];
const CATEGORY_FILTERS = ['All Categories', 'Engine', 'Exhaust', 'Brakes', 'Suspension', 'Body', 'Electrical', 'Accessories'];
const BRAND_FILTERS = ['All Brands', 'Harley-Davidson', 'Ford Performance', 'Vance & Hines', 'Wilwood', 'Progressive Suspension', 'Edelbrock', 'Honda', 'S&S Cycle', 'Holley', 'MSD'];
const CONDITION_FILTERS = ['All Conditions', 'New', 'Like New', 'Good', 'Fair', 'For Parts'];
const SORT_OPTIONS = ['Newest First', 'Price: Low to High', 'Price: High to Low', 'Most Viewed'];

function PartsSidebar({
  selectedAvailability,
  selectedCategory,
  selectedBrand,
  selectedCondition,
  onAvailabilityChange,
  onCategoryChange,
  onBrandChange,
  onConditionChange,
  onClearFilters
}: {
  selectedAvailability: string;
  selectedCategory: string;
  selectedBrand: string;
  selectedCondition: string;
  onAvailabilityChange: (filter: string) => void;
  onCategoryChange: (filter: string) => void;
  onBrandChange: (filter: string) => void;
  onConditionChange: (filter: string) => void;
  onClearFilters: () => void;
}) {
  const hasActiveFilters = selectedAvailability !== 'All Parts' || 
                          selectedCategory !== 'All Categories' || 
                          selectedBrand !== 'All Brands' || 
                          selectedCondition !== 'All Conditions';

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
        >
          Clear All Filters
        </button>
      )}

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Availability</h3>
        <div className="space-y-2">
          {AVAILABILITY_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => onAvailabilityChange(filter)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedAvailability === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Category</h3>
        <div className="space-y-2">
          {CATEGORY_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => onCategoryChange(filter)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedCategory === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Brand</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {BRAND_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => onBrandChange(filter)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedBrand === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Condition</h3>
        <div className="space-y-2">
          {CONDITION_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => onConditionChange(filter)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedCondition === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">About Parts</h3>
        <p className="text-sm text-muted-foreground">
          Browse parts from veteran-owned clubs and shops. Some items are reserved exclusively for veterans and first responders.
        </p>
      </div>
    </div>
  );
}

export default function Parts() {
  const [selectedAvailability, setSelectedAvailability] = useState('All Parts');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedCondition, setSelectedCondition] = useState('All Conditions');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest First');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePartClick = (part: Part) => {
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPart(null);
  };

  const handleClearFilters = () => {
    setSelectedAvailability('All Parts');
    setSelectedCategory('All Categories');
    setSelectedBrand('All Brands');
    setSelectedCondition('All Conditions');
    setSearchQuery('');
  };

  // Filter parts
  let filteredParts = PARTS.filter(part => {
    const matchesAvailability = selectedAvailability === 'All Parts' || part.availability === selectedAvailability;
    const matchesCategory = selectedCategory === 'All Categories' || part.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All Brands' || part.brand === selectedBrand;
    const matchesCondition = selectedCondition === 'All Conditions' || part.condition === selectedCondition;
    const matchesSearch = searchQuery === '' || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAvailability && matchesCategory && matchesBrand && matchesCondition && matchesSearch;
  });

  // Sort parts
  filteredParts = [...filteredParts].sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High':
        return (a.price || 0) - (b.price || 0);
      case 'Price: High to Low':
        return (b.price || 0) - (a.price || 0);
      case 'Most Viewed':
        return b.views - a.views;
      case 'Newest First':
      default:
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
    }
  });

  return (
    <ContentWithSidebar
      sidebar={
        <PartsSidebar
          selectedAvailability={selectedAvailability}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          selectedCondition={selectedCondition}
          onAvailabilityChange={setSelectedAvailability}
          onCategoryChange={setSelectedCategory}
          onBrandChange={setSelectedBrand}
          onConditionChange={setSelectedCondition}
          onClearFilters={handleClearFilters}
        />
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Parts Marketplace</h1>
          <p className="text-muted-foreground">
            Browse quality parts from veteran clubs and shops. Find everything you need for your build or restoration project.
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search parts by name, part number, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex gap-2">
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Parts Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold">{filteredParts.length}</span>
          <span>
            {filteredParts.length === 1 ? 'part' : 'parts'} found
          </span>
        </div>

        {/* Parts Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredParts.map(part => (
              <PartCard key={part.id} part={part} onClick={() => handlePartClick(part)} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParts.map(part => (
              <PartListItem key={part.id} part={part} onClick={() => handlePartClick(part)} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredParts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No parts found matching your filters.</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Part Detail Modal */}
      <PartModal
        part={selectedPart}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </ContentWithSidebar>
  );
}
