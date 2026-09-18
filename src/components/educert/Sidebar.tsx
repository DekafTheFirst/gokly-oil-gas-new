import { NavLink } from "react-router-dom";
import {
  BookOpen,
  ShieldCheck,
  BadgeCheck,
  Settings,
  LogOut,
  ClipboardList,
  Award,
  LayoutDashboard,
  GraduationCap,
  type LucideIcon,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Item = { to: string; label: string; icon: LucideIcon };

const ADMIN_ITEMS: Item[] = [
  { to: "/training/admin", label: "Dashboard", icon: ShieldCheck },
  { to: "/training/certificate-management", label: "Certificate Management", icon: Award },
  { to: "/training/user-management", label: "User Management", icon: User },
  { to: "/training/course-management", label: "Course Management", icon: BookOpen },
];

const TRAINER_ITEMS: Item[] = [
  { to: "/training/trainer-dashboard", label: "My Courses", icon: BookOpen },
  { to: "/training/courses", label: "Course Catalog", icon: ClipboardList },
  { to: "/training/verify", label: "Certifications", icon: BadgeCheck },
];

const TRAINEE_ITEMS: Item[] = [
  { to: "/training/trainee-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/training/courses", label: "My Courses", icon: GraduationCap },
  { to: "/training/verify", label: "Certifications", icon: BadgeCheck },
];

export function getSidebarItemsForRole(role?: string): Item[] {
  const normalized = (role || "").toUpperCase();
  if (normalized === "ADMIN") return ADMIN_ITEMS;
  if (normalized === "TRAINER") return TRAINER_ITEMS;
  // TRAINEE, STUDENT (legacy) and anything else get the trainee menu
  return TRAINEE_ITEMS;
}

export function Sidebar({ terminal = "Terminal 4", subtitle = "FIELD OPERATIONS" }: { terminal?: string; subtitle?: string }) {
  const { user, logout } = useAuth() as { user: { role?: string; first_name?: string } | null; logout: () => void };

  const items = getSidebarItemsForRole(user?.role);

  return (
    <aside className="w-60 flex shrink-0 flex-col border-r border-border bg-card lg:flex" >

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((it, i) => (
          <NavLink
            key={it.to + i}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-primary text-primary-foreground hover:bg-primary" : "text-foreground/75 hover:bg-muted"
              }`
            }
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 px-4 pb-6">
        <div className="space-y-1 text-sm">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button onClick={() => {logout()}} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </div>
    </aside>
  );
}
