import ContentOnly from '@/components/layouts/ContentOnly';

export default function Home() {
  return (
    <ContentOnly>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Veteran Garage Network</h1>
        <p className="text-lg text-muted-foreground">
          This is the home page with a full-width layout (no sidebar).
        </p>
        <div className="prose max-w-none">
          <p>
            This page demonstrates the ContentOnly layout component, which provides
            a clean, full-width content area perfect for landing pages, articles,
            or any content that doesn't need a sidebar.
          </p>
        </div>
      </div>
    </ContentOnly>
  );
}
