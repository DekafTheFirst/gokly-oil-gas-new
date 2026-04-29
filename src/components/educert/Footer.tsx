export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-3 px-6 py-8 md:flex-row md:items-center">
        <div>
          <p className="font-display font-bold text-foreground">Gokly Oil and Gas</p>
          <p className="text-sm text-muted-foreground">© 2024 Gokly Oil and Gas High-performance compliance ensured.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary-deep">Privacy Policy</a>
          <a href="#" className="hover:text-primary-deep">Terms of Service</a>
          <a href="#" className="hover:text-primary-deep">HSE Standards</a>
          <a href="#" className="hover:text-primary-deep">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}
