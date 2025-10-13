import ContentOnly from '@/components/layouts/ContentOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function Home() {
  // Placeholder statistics - can be replaced with API calls later
  const stats = [
    { label: 'Clubs Registered', value: '47' },
    { label: 'Projects Completed', value: '156' },
    { label: 'Events This Month', value: '12' },
    { label: 'Active Members', value: '230' },
  ];

  const pillars = [
    {
      title: 'Emotional Support',
      description: 'Connect with peers who understand PTSD and shared experiences. Find a community that relates to your journey.',
      icon: '🤝', // Placeholder - can be replaced with actual icon component
    },
    {
      title: 'Mechanical Support',
      description: 'Get help with vehicle projects from experienced members. Share knowledge and learn from others in the garage.',
      icon: '🔧', // Placeholder - can be replaced with actual icon component
    },
    {
      title: 'Community Resources',
      description: 'Find local clubs, events, and support networks. Access resources designed specifically for Veterans and First Responders.',
      icon: '🗺️', // Placeholder - can be replaced with actual icon component
    },
  ];

  return (
    <ContentOnly>
      <div className="space-y-16">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This site is under active development. Facebook login does not currently work.
          </AlertDescription>
        </Alert>

        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <h1 className="text-5xl font-bold tracking-tight">
            You're Not Alone. We've Been There.
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connecting Veterans and First Responders to peer groups that understand their experiences,
            their culture, providing both emotional and mechanical support.
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
              The Veteran Garage Network was created by Will 'Sniper7Kills' Gaudette after finding a club
              of interest, but discovering it was too far away to regularly visit. With a lack of resources
              and only a few large Facebook groups to turn to, Will decided that finding these groups and
              resources shouldn't be so hard.
            </p>
            <p>
              VGN focuses on Veterans and First Responders—the people most likely dealing with PTSD and
              most likely needing community support but not knowing how to ask. We understand that it's
              not always easy to reach out, but we're here to make that connection simpler.
            </p>
            <p className="text-xl font-semibold text-foreground text-center pt-4">
              It's OK not to be OK. We're here to help you help yourself.
            </p>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Our Growing Network</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
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
          <h2 className="text-3xl font-bold text-center">How We Support You</h2>
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
            There Are Others With Similar Experiences
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You just need to ask. Whether you're looking for a local club, need help with a project,
            or want to connect with others who understand, we're here to help you find your community.
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
