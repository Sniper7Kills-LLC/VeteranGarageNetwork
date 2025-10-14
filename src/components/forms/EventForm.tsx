import { useState, useEffect, type FormEvent } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '@/../amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LocationPickerMap from '@/components/LocationPickerMap';
import RouteBuilder from '@/components/RouteBuilder';
import ChapterAssociationSelector from '@/components/ChapterAssociationSelector';
import { toast } from 'sonner';
import { EVENT_CATEGORY_VALUES } from '@/../amplify/config/enums';
import { Info, Upload, X, Loader2 } from 'lucide-react';
import { formatTimeForStorage, parseTimeFromStorage } from '@/lib/form-utils';

const client = generateClient<Schema>();

interface RoutePoint {
  latitude: number;
  longitude: number;
  type: 'Start' | 'End' | 'Waypoint' | 'Stop' | 'Join_In' | 'Blockers';
  description: string;
  order: number;
}

export interface EventFormData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category: typeof EVENT_CATEGORY_VALUES[number];
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  route?: RoutePoint[];
  images?: string[];
  chapterAssociations?: Array<{
    chapterId: string;
    relationship: string;
    details?: string;
  }>;
}

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: EventFormData;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
}

export default function EventForm({ mode, initialData, onSubmit, onCancel }: EventFormProps) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  
  // Parse initial time data if in edit mode
  const parsedTimes = initialData?.time && initialData?.category
    ? parseTimeFromStorage(initialData.time, initialData.category)
    : {};

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [category, setCategory] = useState<typeof EVENT_CATEGORY_VALUES[number]>(
    initialData?.category || 'Meetup'
  );
  
  // Time fields - conditional based on category
  const [registrationTime, setRegistrationTime] = useState(parsedTimes.registration || '');
  const [kickstandsUpTime, setKickstandsUpTime] = useState(parsedTimes.kickstandsUp || '');
  const [startTime, setStartTime] = useState(parsedTimes.start || '');
  const [endTime, setEndTime] = useState(parsedTimes.end || '');
  
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>(initialData?.route || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [loadingExistingImages, setLoadingExistingImages] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Chapter association state
  const [chapters, setChapters] = useState<Array<{ id: string; name: string; description: string | null; clubName: string }>>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(
    initialData?.chapterAssociations?.map(a => a.chapterId) || []
  );
  const [chapterAssociations, setChapterAssociations] = useState<Record<string, { relationship: string; details: string }>>(
    initialData?.chapterAssociations?.reduce((acc, assoc) => ({
      ...acc,
      [assoc.chapterId]: { relationship: assoc.relationship, details: assoc.details || '' }
    }), {}) || {}
  );
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [chapterNextToken, setChapterNextToken] = useState<string | null>(null);
  const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing image URLs when component mounts in edit mode
  useEffect(() => {
    const fetchImageUrls = async () => {
      if (mode === 'edit' && existingImages.length > 0) {
        setLoadingExistingImages(true);
        try {
          const urlPromises = existingImages.map(async (imagePath) => {
            // Check if it's already a full URL (for backward compatibility)
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
              return imagePath;
            }
            
            // Otherwise, fetch from S3
            const result = await getUrl({
              path: imagePath,
            });
            return result.url.toString();
          });

          const urls = await Promise.all(urlPromises);
          setExistingImageUrls(urls);
        } catch (error) {
          console.error('Error fetching image URLs:', error);
          setExistingImageUrls([]);
        } finally {
          setLoadingExistingImages(false);
        }
      }
    };

    fetchImageUrls();
  }, [mode, existingImages]);

  // Fetch chapters when component mounts
  useEffect(() => {
    fetchChapters('', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search for chapters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChapters(chapterSearchQuery, false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSearchQuery]);

  const fetchChapters = async (searchQuery: string, append: boolean) => {
    if (append) {
      setIsLoadingMoreChapters(true);
    } else {
      setLoadingChapters(true);
    }
    
    try {
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';
      
      const filter = { approved: { eq: true } };
      
      const response = await client.models.ClubChapter.list({
        selectionSet: ['id', 'name', 'description', 'clubId', 'approved', 'club.name'],
        authMode,
        filter,
        limit: 50,
        nextToken: append ? chapterNextToken : undefined,
      });
      
      if (response.data) {
        const formattedChapters = response.data.map((chapter) => ({
          id: chapter.id,
          name: chapter.name,
          description: chapter.description,
          clubName: chapter.club?.name || 'Unknown Club',
        }));
        
        // Apply client-side filtering for search query
        let filteredChapters = formattedChapters;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          filteredChapters = formattedChapters.filter((chapter) => {
            return (
              chapter.name.toLowerCase().includes(query) ||
              (chapter.description && chapter.description.toLowerCase().includes(query)) ||
              chapter.clubName.toLowerCase().includes(query)
            );
          });
        }
        
        if (append) {
          setChapters((prev) => [...prev, ...filteredChapters]);
        } else {
          setChapters(filteredChapters);
        }
        
        setChapterNextToken(response.nextToken || null);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      if (!append) {
        toast.error('Failed to load chapters');
      }
    } finally {
      setLoadingChapters(false);
      setIsLoadingMoreChapters(false);
    }
  };

  const handleLoadMoreChapters = () => {
    if (chapterNextToken && !isLoadingMoreChapters) {
      fetchChapters(chapterSearchQuery, true);
    }
  };

  const handleChapterToggle = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const newSelected = prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId];
      
      // Initialize or remove associations
      if (newSelected.includes(chapterId) && !chapterAssociations[chapterId]) {
        setChapterAssociations((prevAssoc) => ({
          ...prevAssoc,
          [chapterId]: { relationship: '', details: '' },
        }));
      } else if (!newSelected.includes(chapterId)) {
        setChapterAssociations((prevAssoc) => {
          const newAssoc = { ...prevAssoc };
          delete newAssoc[chapterId];
          return newAssoc;
        });
      }
      
      return newSelected;
    });
  };

  const updateChapterAssociation = (chapterId: string, field: 'relationship' | 'details', value: string) => {
    setChapterAssociations((prev) => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!title.trim() || title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!description.trim() || description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      // Check if date is in the future (only for create mode)
      if (mode === 'create') {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          newErrors.date = 'Event date must be in the future';
        }
      }
    }
    
    // Time validation - conditional based on category
    if (category === 'Ride') {
      if (!registrationTime) {
        newErrors.registrationTime = 'Registration time is required';
      }
      if (!kickstandsUpTime) {
        newErrors.kickstandsUpTime = 'Kickstands up time is required';
      }
      // Validate kickstandsUp is after registration
      if (registrationTime && kickstandsUpTime && kickstandsUpTime <= registrationTime) {
        newErrors.kickstandsUpTime = 'Kickstands up time must be after registration time';
      }
    } else {
      if (!startTime) {
        newErrors.startTime = 'Start time is required';
      }
      // endTime is optional, no validation needed
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    if (latitude === null || longitude === null) {
      newErrors.location = 'Please select a location on the map';
    }
    
    // Route validation for Ride events
    if (category === 'Ride' && routePoints.length < 2) {
      newErrors.route = 'Ride events must have at least 2 route points';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images to S3 if any
      let uploadedImageKeys: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        toast.info('Uploading images...', { duration: 2000 });

        try {
          const uploadPromises = imageFiles.map(async (file, index) => {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${Date.now()}-${index}.${fileExtension}`;
            const key = `event-images/${fileName}`;

            const result = await uploadData({
              path: key,
              data: file,
              options: {
                contentType: file.type,
              }
            }).result;

            return result.path;
          });

          uploadedImageKeys = await Promise.all(uploadPromises);
          toast.success('Images uploaded successfully!');
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          toast.error('Failed to upload images', {
            description: 'Please try again',
          });
          throw uploadError;
        } finally {
          setUploadingImages(false);
        }
      }

      // Combine existing images with newly uploaded ones
      const allImages = [...existingImages, ...uploadedImageKeys];

      // Format time string based on category
      const timeString = formatTimeForStorage(category, {
        registration: registrationTime,
        kickstandsUp: kickstandsUpTime,
        start: startTime,
        end: endTime,
      });

      // Prepare form data
      const formData: EventFormData = {
        id: initialData?.id,
        title: title.trim(),
        description: description.trim(),
        date,
        time: timeString,
        category,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        latitude: latitude!,
        longitude: longitude!,
        route: category === 'Ride' && routePoints.length > 0 ? routePoints : undefined,
        images: allImages.length > 0 ? allImages : undefined,
        chapterAssociations: selectedChapterIds
          .filter(id => chapterAssociations[id]?.relationship)
          .map(id => ({
            chapterId: id,
            relationship: chapterAssociations[id].relationship,
            details: chapterAssociations[id].details || undefined,
          })),
      };

      // Call parent's onSubmit handler
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${mode} event`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
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
    // Auto-fill address fields if geocoding was successful
    if (location.address) setAddress(location.address);
    if (location.city) setCity(location.city);
    if (location.state) setState(location.state);
    if (location.zipCode) setZipCode(location.zipCode);
    setErrors(prev => ({ ...prev, location: '' }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Invalid file type', {
        description: 'Please upload only image files (JPEG, PNG, GIF, WebP)',
      });
      return;
    }

    // Validate file sizes (5MB max per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = newFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error('File too large', {
        description: 'Each image must be less than 5MB',
      });
      return;
    }

    // Limit total number of images
    const totalImages = existingImages.length + imageFiles.length + newFiles.length;
    if (totalImages > 5) {
      toast.error('Too many images', {
        description: 'You can upload a maximum of 5 images',
      });
      return;
    }

    // Add files and create previews
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informative Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>💡 Planning a Ride Event?</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Keep your Ride event focused on the journey itself:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the starting location as your event location</li>
            <li>Include your route with all waypoints</li>
            <li>If there's a party, BBQ, or gathering at the destination, create that as a separate "Meetup" event</li>
          </ul>
          <p className="mt-2 text-sm font-medium">
            This helps riders choose whether to join the ride, the destination activity, or both!
          </p>
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details about your event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">
              Event Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Veterans Day Ride"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event in detail..."
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {description.length} characters (minimum 10)
            </p>
          </div>

          <div>
            <Label htmlFor="date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? 'border-destructive' : ''}
            />
            {errors.date && (
              <p className="text-sm text-destructive mt-1">{errors.date}</p>
            )}
          </div>

          {/* Conditional time inputs based on category */}
          {category === 'Ride' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationTime">
                  Registration Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="registrationTime"
                  type="time"
                  value={registrationTime}
                  onChange={(e) => setRegistrationTime(e.target.value)}
                  className={errors.registrationTime ? 'border-destructive' : ''}
                />
                {errors.registrationTime && (
                  <p className="text-sm text-destructive mt-1">{errors.registrationTime}</p>
                )}
              </div>

              <div>
                <Label htmlFor="kickstandsUpTime">
                  Kickstands Up Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kickstandsUpTime"
                  type="time"
                  value={kickstandsUpTime}
                  onChange={(e) => setKickstandsUpTime(e.target.value)}
                  className={errors.kickstandsUpTime ? 'border-destructive' : ''}
                />
                {errors.kickstandsUpTime && (
                  <p className="text-sm text-destructive mt-1">{errors.kickstandsUpTime}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={errors.startTime ? 'border-destructive' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-destructive mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof EVENT_CATEGORY_VALUES[number])}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              {EVENT_CATEGORY_VALUES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>
            Specify where the event will take place
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
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
                placeholder="San Diego"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CA"
              />
            </div>

            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="92101"
              />
            </div>
          </div>

          <div>
            <Label>
              Map Location <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Click on the map to set the event location
            </p>
            <LocationPickerMap
              onLocationSelect={handleLocationSelect}
              initialPosition={latitude && longitude ? [latitude, longitude] : undefined}
            />
            {errors.location && (
              <p className="text-sm text-destructive mt-1">{errors.location}</p>
            )}
            {latitude !== null && longitude !== null && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Builder (only for Ride events) */}
      {category === 'Ride' && (
        <Card>
          <CardHeader>
            <CardTitle>Route Planning</CardTitle>
            <CardDescription>
              Plan your ride route by clicking on the map to add waypoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RouteBuilder
              value={routePoints}
              onChange={setRoutePoints}
              center={latitude && longitude ? [latitude, longitude] : undefined}
            />
            {errors.route && (
              <p className="text-sm text-destructive mt-2">{errors.route}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Event Images</CardTitle>
          <CardDescription>
            Upload images for your event (e.g., flyer, promotional images). Maximum 5 images, 5MB each.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Input */}
          <div>
            <Label htmlFor="image-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload images</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP up to 5MB each (max 5 images)
                </p>
              </div>
              <Input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageFileChange}
                className="hidden"
                disabled={existingImages.length + imageFiles.length >= 5 || uploadingImages}
              />
            </Label>
          </div>

          {/* Existing Images (edit mode) */}
          {existingImages.length > 0 && (
            <div>
              <Label className="mb-2 block">Current Images</Label>
              {loadingExistingImages ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((_, index) => (
                    <div key={index} className="w-full h-32 bg-muted animate-pulse rounded-lg border" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImageUrls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveExistingImage(index)}
                        disabled={uploadingImages}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <Label className="mb-2 block">New Images</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveNewImage(index)}
                      disabled={uploadingImages}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {imageFiles[index]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadingImages && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading images...</span>
            </div>
          )}

          {/* Info Text */}
          {(existingImages.length > 0 || imageFiles.length > 0) && (
            <p className="text-sm text-muted-foreground">
              {existingImages.length + imageFiles.length} image{existingImages.length + imageFiles.length !== 1 ? 's' : ''} selected
              {existingImages.length + imageFiles.length >= 5 && ' (maximum reached)'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chapter Associations */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter Associations</CardTitle>
          <CardDescription>
            Associate this event with chapters (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChapterAssociationSelector
            chapters={chapters}
            selectedChapterIds={selectedChapterIds}
            chapterAssociations={chapterAssociations}
            onChapterToggle={handleChapterToggle}
            onUpdateAssociation={updateChapterAssociation}
            searchQuery={chapterSearchQuery}
            onSearchChange={setChapterSearchQuery}
            isLoading={loadingChapters}
            hasMore={chapterNextToken !== null}
            onLoadMore={handleLoadMoreChapters}
            isLoadingMore={isLoadingMoreChapters}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Creating Event...' : 'Updating Event...'}
            </>
          ) : (
            mode === 'create' ? 'Create Event' : 'Update Event'
          )}
        </Button>
      </div>
    </form>
  );
}
