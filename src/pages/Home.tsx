import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';

const client = generateClient<Schema>();

interface Stats {
  chapters: number;
  events: number;
  members: number;
  projects: number;
}

export default function Home() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Determine auth mode based on authentication status
        const authMode = authStatus === 'authenticated' ? 'userPool' : 'identityPool';

        // Call the Lambda function via the GraphQL query
        const { data: statsData, errors } = await client.queries.getStats({ authMode });

        if (errors) {
          throw new Error(errors.map(e => e.message).join(', '));
        }

        if (statsData) {
          setStats({
            chapters: statsData.chapters,
            events: statsData.events,
            members: statsData.members,
            projects: statsData.projects,
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics');
        // Set fallback stats
        setStats({ chapters: 0, events: 0, members: 0, projects: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [authStatus]);

  const displayStats = [
    { label: 'Chapters Registered', value: loading ? '...' : (stats?.chapters.toString() || '0') },
    { label: 'Projects Completed', value: loading ? '...' : (stats?.projects.toString() || '0') },
    { label: 'Events So Far', value: loading ? '...' : (stats?.events.toString() || '0') },
    { label: 'Active Members', value: loading ? '...' : (stats?.members.toString() || '0') },
  ];

  const pillars = [
    {
      title: 'Discover Communities',
      description: 'Find car and bike clubs you didn\'t know existed. Connect with private, close-knit groups that share your passion and understand your background.',
      icon: '🔍', // Placeholder - can be replaced with actual icon component
    },
    {
      title: 'Centralized Events',
      description: 'No more hunting through Facebook groups. Track all events in one place and never miss a ride, meet, or fundraiser.',
      icon: '�', // Placeholder - can be replaced with actual icon component
    },
    {
      title: 'United Support',
      description: 'Bring communities together when it matters most. Multiple chapters, multiple clubs, one mission: supporting each other.',
      icon: '🤝', // Placeholder - can be replaced with actual icon component
    },
  ];

  return (
    <ContentOnly>
      <div className="space-y-16">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="border-2 border-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-center font-semibold text-base">
              This site is under active development. Facebook login does not currently work.
            </AlertDescription>
          </Alert>
        </div>

        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <h1 className="text-5xl font-bold tracking-tight">
            Building Communities Around Those Who Answered The Call
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connecting Veterans and First Responders to car and bike communities they may not know about.
            One centralized place to find clubs, track events, and bring communities together for support.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/clubs">
              <Button size="lg">Find a Club</Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline">View Events</Button>
            </Link>
          </div>
        </section>

        {/* Mission/Story Section */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center">Our Mission</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Many motorcycle clubs and car communities are private, close-knit groups. Events are shared 
              on Facebook to local groups, scattered across different pages, and it's a pain to track down 
              when the next event is. Veterans and First Responders often don't even know these communities exist.
            </p>
            <p>
              VGN creates a centralized location to share across these different communities and helps each 
              community connect with others for support. What's better than having groups show up from all 
              of the local chapters of local clubs when you're fundraising for your fallen brother?
            </p>
            <p>
              VGN is about building communities around First Responders and Veterans. We answered the call, 
              did things we protect others from. It's time for us to help each other.
            </p>
            <p className="text-xl font-semibold text-foreground text-center pt-4">
              It's OK not to be OK. We're here to help you help yourself.
            </p>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Our Growing Network</h2>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayStats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Three Pillars Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">What We Provide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <Card key={pillar.title}>
                <CardHeader>
                  <div className="text-4xl mb-2">{pillar.icon}</div>
                  <CardTitle>{pillar.title}</CardTitle>
                  <CardDescription>{pillar.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center space-y-6 py-12 bg-muted/50 rounded-lg px-6">
          <h2 className="text-3xl font-bold">
            Find Your Tribe. Build Your Community.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're looking for a local chapter, tracking down the next event, or wanting to 
            connect communities for support—VGN brings it all together in one place.
          </p>
          <div className="flex gap-4 justify-center pt-4 flex-wrap">
            <Link to="/clubs">
              <Button size="lg">Explore Clubs</Button>
            </Link>
            <Link to="/projects">
              <Button size="lg" variant="outline">View Projects</Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline">Upcoming Events</Button>
            </Link>
          </div>
        </section>
      </div>
    </ContentOnly>
  );
}
