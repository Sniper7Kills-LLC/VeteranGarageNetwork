export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Veteran Garage Network. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Its ok to not be ok. A concept for a greater cause.
          </p>
        </div>
      </div>
    </footer>
  );
}
