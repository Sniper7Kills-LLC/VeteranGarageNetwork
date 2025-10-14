import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
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
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import { useEffect } from 'react';

const client = generateClient<Schema>();

// Helper function to convert 24-hour time to 12-hour AM/PM format
function formatTimeTo12Hour(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Format time string for database storage
function formatTimeForStorage(
  category: string,
  times: {
    registration?: string;
    kickstandsUp?: string;
    start?: string;
    end?: string;
  }
): string {
  if (category === 'Ride') {
    return `Registration: ${formatTimeTo12Hour(times.registration!)} | Kickstands Up: ${formatTimeTo12Hour(times.kickstandsUp!)}`;
  } else {
    if (times.end) {
      return `${formatTimeTo12Hour(times.start!)} - ${formatTimeTo12Hour(times.end)}`;
    }
    return formatTimeTo12Hour(times.start!);
  }
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  type: 'Start' | 'End' | 'Waypoint' | 'Stop' | 'Join_In' | 'Blockers';
  description: string;
  order: number;
}

interface ChapterAssociation {
  chapterId: string;
  relationship: string;
  details?: string;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<typeof EVENT_CATEGORY_VALUES[number]>('Meetup');
  // Time fields - conditional based on category
  const [registrationTime, setRegistrationTime] = useState('');
  const [kickstandsUpTime, setKickstandsUpTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [images, setImages] = useState<string[]>(['']);
  
  // Chapter association state
  const [chapters, setChapters] = useState<Array<{ id: string; name: string; description: string | null; clubName: string }>>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [chapterAssociations, setChapterAssociations] = useState<Record<string, { relationship: string; details: string }>>({});
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [chapterNextToken, setChapterNextToken] = useState<string | null>(null);
  const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAuthenticated = authStatus === 'authenticated';

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

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

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
      // Check if date is in the future
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Event date must be in the future';
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
      // Get current user's identity
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Filter out empty image URLs
      const validImages = images.filter(img => img.trim() !== '');

      // Format time string based on category
      const timeString = formatTimeForStorage(category, {
        registration: registrationTime,
        kickstandsUp: kickstandsUpTime,
        start: startTime,
        end: endTime,
      });

      // Determine auth mode based on authentication status
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';

      // Create the event
      const eventData = {
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
        images: validImages.length > 0 ? validImages : undefined,
        approved: false,
        owners: [userId],
      };

      const { data: event, errors: eventErrors } = await client.models.Event.create(eventData, {
        authMode
      });

      if (eventErrors && eventErrors.length > 0) {
        throw new Error(eventErrors[0].message);
      }

      if (!event) {
        throw new Error('Failed to create event');
      }

      // Create chapter associations if any
      if (selectedChapterIds.length > 0) {
        const chapterAssociationPromises = selectedChapterIds.map(async (chapterId) => {
          const association = chapterAssociations[chapterId];
          if (!association?.relationship) {
            console.warn(`Skipping chapter association for ${chapterId} - no relationship type specified`);
            return null;
          }

          try {
            const { data, errors } = await client.models.EventChapterAssociation.create(
              {
                eventId: event.id,
                chapterId,
                relationship: association.relationship,
                details: association.details || undefined,
                approved: false,
              },
              { authMode }
            );

            if (errors && errors.length > 0) {
              console.error(`Error creating chapter association for ${chapterId}:`, errors);
              return null;
            }

            return data;
          } catch (error) {
            console.error(`Error creating chapter association for ${chapterId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(chapterAssociationPromises);
        const successfulAssociations = results.filter((r) => r !== null).length;

        if (successfulAssociations > 0) {
          console.log(`Created ${successfulAssociations} chapter associations`);
        }
      }

      // Success!
      toast.success('Event created successfully!', {
        description: 'Your event is pending approval and will be visible once reviewed by an administrator.',
        duration: 5000,
      });

      // Navigate back to events page
      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event', {
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

  const handleAddImage = () => {
    setImages([...images, '']);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  return (
    <ContentOnly>
      <div className="w-full py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/events')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground mt-2">
            Fill out the form below to create a new event. Your event will be reviewed before being published.
          </p>
        </div>

        {/* Informative Alert */}
        <Alert className="mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Add image URLs for your event (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.map((image, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {images.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveImage(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddImage}
              >
                Add Another Image
              </Button>
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
              onClick={() => navigate('/events')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </div>
    </ContentOnly>
  );
}
