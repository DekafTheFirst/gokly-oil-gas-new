import { NavLink } from "react-router-dom";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { to: "/training" as const, label: "Home" },
  { to: "/training/courses" as const, label: "Courses" },
  { to: "/training/dashboard" as const, label: "Dashboard" },
  { to: "/training/verify" as const, label: "Certifications" },
  { to: "/training/admin" as const, label: "Support" },
];

export function AdminTopNav({ searchPlaceholder = "Search certificates..." }: { searchPlaceholder?: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-6">
        <Logo />
      
        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="h-10 w-72 rounded-full bg-input pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-energy" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-deep font-display text-sm font-bold text-primary-foreground">
            RM
          </div>
        </div>
      </div>
    </header>
  );
}
