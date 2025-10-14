import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/../amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import EventForm, { type EventFormData } from '@/components/forms/EventForm';

const client = generateClient<Schema>();

export default function CreateEvent() {
  const navigate = useNavigate();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  const isAuthenticated = authStatus === 'authenticated';

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (formData: EventFormData) => {
    try {
      // Get current user's identity
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Determine auth mode based on authentication status
      const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';

      // Create the event
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        category: formData.category,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        route: formData.route,
        images: formData.images,
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
      if (formData.chapterAssociations && formData.chapterAssociations.length > 0) {
        const chapterAssociationPromises = formData.chapterAssociations.map(async (association) => {
          try {
            const { data, errors } = await client.models.EventChapterAssociation.create(
              {
                eventId: event.id,
                chapterId: association.chapterId,
                relationship: association.relationship,
                details: association.details,
                approved: false,
              },
              { authMode }
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
      throw error; // Re-throw to let EventForm handle the error display
    }
  };

  const handleCancel = () => {
    navigate('/events');
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

        <EventForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </ContentOnly>
  );
}
