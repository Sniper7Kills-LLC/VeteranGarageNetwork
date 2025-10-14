import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const client = generateClient<Schema>();

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data } = await client.models.Event.get(
          { id },
          { authMode: 'userPool' }
        );
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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

  if (!event) {
    return (
      <ContentOnly>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center">Event Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                The event you're looking for doesn't exist or you don't have permission to edit it.
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-muted-foreground mt-2">
              Manage your event details
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/profile')}>
            Back to Profile
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">{event.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{event.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Full event editing functionality coming soon. For now, you can view your event details here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentOnly>
  );
}
