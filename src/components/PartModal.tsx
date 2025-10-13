import { MapPin, Package, DollarSign, Eye } from 'lucide-react';
import { useState } from 'react';
import ImageCarousel from './ImageCarousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

interface PartModalProps {
  part: Part | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PartModal({ part, isOpen, onClose }: PartModalProps) {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    isVeteran: false,
    isFirstResponder: false
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Reset form when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setShowRequestForm(false);
      setFormSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        isVeteran: false,
        isFirstResponder: false
      });
    }
  };

  if (!part) return null;

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

  const handleImageClick = (index: number) => {
    setCarouselIndex(index);
    setIsCarouselOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the request to a backend
    console.log('Part request submitted:', { part: part.id, ...formData });
    setFormSubmitted(true);
    setTimeout(() => {
      setShowRequestForm(false);
      setFormSubmitted(false);
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isRestricted = part.availability === 'Veterans Only' || part.availability === 'First Responders Only';
  const canRequest = !isRestricted || 
    (part.availability === 'Veterans Only' && formData.isVeteran) ||
    (part.availability === 'First Responders Only' && formData.isFirstResponder);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {/* Main Image */}
          <div className="relative h-96 overflow-hidden cursor-pointer" onClick={() => handleImageClick(0)}>
            <img
              src={part.mainImage}
              alt={part.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge className={availabilityColors[part.availability]}>
                  {part.availability}
                </Badge>
                <Badge className={conditionColors[part.condition]}>
                  {part.condition}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                  {part.category}
                </Badge>
              </div>
              <DialogHeader className="text-left space-y-1 p-0">
                <DialogTitle className="text-3xl font-bold text-white">{part.name}</DialogTitle>
                <p className="text-white/90 text-sm">Part #: {part.partNumber}</p>
              </DialogHeader>
            </div>
          </div>

          {/* Additional Images */}
          {part.images.length > 1 && (
            <div className="px-6 pt-6">
              <h3 className="text-sm font-semibold mb-3">Additional Images</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {part.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => handleImageClick(index)}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={image}
                      alt={`${part.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Price and Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Price</span>
                </div>
                <p className="text-2xl font-bold">
                  {part.price ? `$${part.price.toLocaleString()}` : 'Contact'}
                </p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Quantity</span>
                </div>
                <p className="text-2xl font-bold">{part.quantity}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Location</span>
                </div>
                <p className="text-lg font-bold">{part.location}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Views</span>
                </div>
                <p className="text-2xl font-bold">{part.views}</p>
              </div>
            </div>

            {/* Part Details */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <h3 className="text-lg font-semibold mb-4">Part Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Brand</p>
                  <p className="font-semibold">{part.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold">{part.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Subcategory</p>
                  <p className="font-semibold">{part.subcategory}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Condition</p>
                  <p className="font-semibold">{part.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Posted</p>
                  <p className="font-semibold">{part.datePosted}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Availability</p>
                  <p className="font-semibold">{part.availability}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground leading-relaxed">{part.description}</p>
              </div>
            </div>

            {/* Fitment Information */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <h3 className="text-lg font-semibold mb-4">Compatible Vehicles</h3>
              <div className="flex flex-wrap gap-2">
                {part.fitment.map((vehicle, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/10"
                  >
                    {vehicle}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Seller Information */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {part.sellerName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{part.sellerName}</h4>
                  <p className="text-muted-foreground mb-2">{part.sellerType}</p>
                  <p className="text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {part.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Form or Button */}
            {!showRequestForm ? (
              <div className="border border-border rounded-lg p-5 bg-primary/5">
                <h3 className="text-lg font-semibold mb-2">Interested in this part?</h3>
                <p className="text-muted-foreground mb-4">
                  {isRestricted
                    ? `This part is available to ${part.availability.toLowerCase()} only. Submit a request to connect with the seller.`
                    : 'Submit a request to connect with the seller and get more information.'}
                </p>
                <Button
                  onClick={() => setShowRequestForm(true)}
                  className="font-semibold w-full md:w-auto"
                >
                  Request This Part
                </Button>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-5 bg-card">
                <h3 className="text-lg font-semibold mb-4">Request Part</h3>
                {formSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Request Submitted!</h4>
                    <p className="text-muted-foreground">
                      The seller will contact you soon with more information.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell the seller about your interest in this part..."
                      />
                    </div>
                    {isRestricted && (
                      <div className="border border-border rounded-lg p-4 bg-muted/50">
                        <p className="text-sm font-medium mb-3">Verification Required</p>
                        {part.availability === 'Veterans Only' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isVeteran"
                              checked={formData.isVeteran}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, isVeteran: checked as boolean }))
                              }
                            />
                            <Label htmlFor="isVeteran" className="cursor-pointer">
                              I am a veteran
                            </Label>
                          </div>
                        )}
                        {part.availability === 'First Responders Only' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isFirstResponder"
                              checked={formData.isFirstResponder}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, isFirstResponder: checked as boolean }))
                              }
                            />
                            <Label htmlFor="isFirstResponder" className="cursor-pointer">
                              I am a first responder
                            </Label>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={!canRequest}
                        className="flex-1 font-semibold"
                      >
                        Submit Request
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRequestForm(false)}
                        className="font-semibold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Carousel */}
      <ImageCarousel
        images={part.images}
        initialIndex={carouselIndex}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />
    </>
  );
}
