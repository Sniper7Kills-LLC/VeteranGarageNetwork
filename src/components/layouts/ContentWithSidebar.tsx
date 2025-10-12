import type { ReactNode } from 'react';

interface ContentWithSidebarProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export default function ContentWithSidebar({ children, sidebar }: ContentWithSidebarProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {/* Right sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
