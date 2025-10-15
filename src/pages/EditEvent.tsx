import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import EventForm, { type EventFormData } from '@/components/forms/EventForm';

const client = generateClient<Schema>();

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('No event ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get current user to verify ownership
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload.sub as string;

        if (!userId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // Fetch the event
        const { data: eventData, errors } = await client.models.Event.get(
          { id },
          { 
            authMode: 'userPool',
            selectionSet: [
              'id',
              'title',
              'description',
              'date',
              'time',
              'category',
              'address',
              'city',
              'state',
              'zipCode',
              'latitude',
              'longitude',
              'route.*',
              'images',
              'owners',
            ]
          }
        );

        if (errors && errors.length > 0) {
          console.error('Errors fetching event:', errors);
          setError('Failed to load event');
          setLoading(false);
          return;
        }

        if (!eventData) {
          setError('Event not found');
          setLoading(false);
          return;
        }

        // Verify ownership
        if (!eventData.owners?.includes(userId)) {
          setError('You do not have permission to edit this event');
          setLoading(false);
          return;
        }

        // Fetch chapter associations
        const { data: associations } = await client.models.EventChapterAssociation.list({
          filter: { eventId: { eq: id } },
          authMode: 'userPool',
        });

        // Deduplicate associations by chapterId (keep the first occurrence)
        const uniqueAssociations = associations?.reduce((acc, assoc) => {
          if (!acc.some(a => a.chapterId === assoc.chapterId)) {
            acc.push(assoc);
          }
          return acc;
        }, [] as typeof associations) || [];

        // Transform to EventFormData
        const formData: EventFormData = {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description || '',
          date: eventData.date,
          time: eventData.time || '',
          category: eventData.category || 'Meetup',
          address: eventData.address || undefined,
          city: eventData.city || undefined,
          state: eventData.state || undefined,
          zipCode: eventData.zipCode || undefined,
          latitude: eventData.latitude || 0,
          longitude: eventData.longitude || 0,
          route: eventData.route?.filter(point => point !== null).map(point => ({
            latitude: point!.latitude,
            longitude: point!.longitude,
            type: point!.type as 'Start' | 'End' | 'Waypoint' | 'Stop' | 'Join_In' | 'Blockers',
            description: point!.description || '',
            order: point!.order,
          })) || undefined,
          images: eventData.images?.filter((img): img is string => img !== null) || undefined,
          chapterAssociations: uniqueAssociations.map(assoc => ({
            chapterId: assoc.chapterId,
            relationship: assoc.relationship,
            details: assoc.details || undefined,
          })),
        };

        setEvent(formData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleSubmit = async (formData: EventFormData) => {
    if (!id) {
      throw new Error('No event ID');
    }

    try {
      // Get current user ID to maintain ownership
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      // Update the event - include owners field to maintain authorization
      const { data: updatedEvent, errors: updateErrors } = await client.models.Event.update(
        {
          id,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          category: formData.category,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zipCode || null,
          latitude: formData.latitude,
          longitude: formData.longitude,
          route: formData.route || null,
          images: formData.images || null,
          owners: [userId], // Maintain ownership
        },
        { authMode: 'userPool' }
      );

      if (updateErrors && updateErrors.length > 0) {
        throw new Error(updateErrors[0].message);
      }

      if (!updatedEvent) {
        throw new Error('Failed to update event');
      }

      // Handle chapter associations
      // First, delete existing associations
      const { data: existingAssociations } = await client.models.EventChapterAssociation.list({
        filter: { eventId: { eq: id } },
        authMode: 'userPool',
      });

      if (existingAssociations && existingAssociations.length > 0) {
        console.log(`Attempting to delete ${existingAssociations.length} existing chapter associations`);
        
        const deleteResults = await Promise.all(
          existingAssociations.map(async (assoc) => {
            try {
              const result = await client.models.EventChapterAssociation.delete(
                { id: assoc.id }, 
                { authMode: 'userPool' }
              );
              
              if (result.errors && result.errors.length > 0) {
                console.error(`Failed to delete association ${assoc.id}:`, result.errors);
                return { success: false, id: assoc.id, errors: result.errors };
              }
              
              console.log(`Successfully deleted association ${assoc.id}`);
              return { success: true, id: assoc.id };
            } catch (error) {
              console.error(`Exception deleting association ${assoc.id}:`, error);
              return { success: false, id: assoc.id, error };
            }
          })
        );
        
        const failedDeletions = deleteResults.filter(r => !r.success);
        if (failedDeletions.length > 0) {
          console.warn(`${failedDeletions.length} associations failed to delete:`, failedDeletions);
          toast.warning('Some existing associations could not be removed', {
            description: 'This may result in duplicate associations. Please contact support if this persists.',
          });
        } else {
          console.log('All existing associations deleted successfully');
        }
      }

      // Create new associations
      if (formData.chapterAssociations && formData.chapterAssociations.length > 0) {
        const chapterAssociationPromises = formData.chapterAssociations.map(async (association) => {
          try {
            const { data, errors } = await client.models.EventChapterAssociation.create(
              {
                eventId: id,
                chapterId: association.chapterId,
                relationship: association.relationship,
                details: association.details,
                approved: false,
              },
              { authMode: 'userPool' }
            );

            if (errors && errors.length > 0) {
              console.error(`Error creating chapter association for ${association.chapterId}:`, errors);
              return null;
            }

            return data;
          } catch (error) {
            console.error(`Error creating chapter association for ${association.chapterId}:`, error);
            return null;
          }
        });

        await Promise.all(chapterAssociationPromises);
      }

      // Success!
      toast.success('Event updated successfully!', {
        description: 'Your changes have been saved.',
        duration: 5000,
      });

      // Navigate back to profile
      navigate('/profile');
    } catch (error) {
      console.error('Error updating event:', error);
      throw error; // Re-throw to let EventForm handle the error display
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <ContentOnly>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-sm text-muted-foreground mt-2">Loading event...</p>
          </div>
        </div>
      </ContentOnly>
    );
  }

  if (error || !event) {
    return (
      <ContentOnly>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center">
                {error === 'You do not have permission to edit this event' 
                  ? 'Access Denied' 
                  : 'Event Not Found'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {error || "The event you're looking for doesn't exist."}
              </p>
              <Button onClick={() => navigate('/profile')}>
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </ContentOnly>
    );
  }

  return (
    <ContentOnly>
      <div className="w-full py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground mt-2">
            Update your event details below.
          </p>
        </div>

        <EventForm
          mode="edit"
          initialData={event}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </ContentOnly>
  );
}
