import type { ReactNode } from 'react';

interface ContentOnlyProps {
  children: ReactNode;
}

export default function ContentOnly({ children }: ContentOnlyProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
}
