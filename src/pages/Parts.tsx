import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';

function PartsSidebar() {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            All Parts
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            For Sale
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            For Trade
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Free to Veterans Only
          </button>
        </div>
      </div>
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Brand</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Honda
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Harley
          </button>
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            Suzuki
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Parts() {
  return (
    <ContentWithSidebar sidebar={<PartsSidebar />}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Find a Parts</h1>
        <p className="text-muted-foreground">
          A list of parts available for veteran projects, or for sale to support veteran projects.
        </p>
      </div>
    </ContentWithSidebar>
  );
}
