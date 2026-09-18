import { NavLink } from "react-router-dom";
import { Bell, HelpCircle, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/context/AuthContext";

const ADMIN_LINKS = [
  { to: "/training/admin" as const, label: "Dashboard" },
  { to: "/training/course-management" as const, label: "Courses" },
  { to: "/training/user-management" as const, label: "Users" },
  { to: "/training/certificate-management" as const, label: "Certificates" },
];

const TRAINER_LINKS = [
  { to: "/training/trainer-dashboard" as const, label: "My Courses" },
  { to: "/training/courses" as const, label: "Course Catalog" },
  { to: "/training/verify" as const, label: "Certifications" },
];

const TRAINEE_LINKS = [
  { to: "/training/trainee-dashboard" as const, label: "Dashboard" },
  { to: "/training/courses" as const, label: "My Courses" },
  { to: "/training/verify" as const, label: "Certifications" },
];

export function AdminTopNav({
  searchPlaceholder = "Search certificates...",
  onMenuClick,
}: {
  searchPlaceholder?: string;
  onMenuClick?: () => void;
}) {
  const { user } = useAuth() as { user: { role?: string; first_name?: string; name?: string } | null };
  const role = (user?.role || "").toUpperCase();
  const links = role === "ADMIN" ? ADMIN_LINKS : role === "TRAINER" ? TRAINER_LINKS : TRAINEE_LINKS;
  const initials = (user?.first_name?.[0] || user?.name?.[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 items-center gap-2 px-4 sm:gap-4 sm:px-6">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-foreground/70 transition hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to + l.label}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? "text-primary-deep border-b-2 border-primary pb-1" : "text-foreground/70 hover:text-primary-deep"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          {/* <div className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="h-10 w-72 rounded-full bg-input pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div> */}
          <button className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-energy" />
          </button>
          <button className="hidden grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted sm:grid" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-deep font-display text-sm font-bold text-primary-foreground">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
