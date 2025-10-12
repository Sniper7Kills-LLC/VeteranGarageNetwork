import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';

function ShopsSidebar() {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
            All Shops
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shops() {
  return (
    <ContentWithSidebar sidebar={<ShopsSidebar />}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Find a Shop</h1>
      </div>
    </ContentWithSidebar>
  );
}
