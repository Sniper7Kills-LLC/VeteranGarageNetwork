import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              VGN
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/clubs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Clubs
              </Link>
              <Link to="/shops" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Shops
              </Link>
              <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Projects
              </Link>
              <Link to="/parts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Parts
              </Link>
              <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Events
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
