import { NavLink } from "react-router-dom";
import { BookOpen, ShieldCheck, BarChart3, BadgeCheck, Settings, LogOut, ClipboardList, FilePlus2, Award, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Item = { to: "/training/dashboard" | "/training/courses" | "/training/admin" | "/training/verify"; label: string; icon: LucideIcon };

const items: Item[] = [
  { to: "/training/admin", label: "Dashboard", icon: ShieldCheck },
  { to: "/training/certificate-management", label: "Certificate Management", icon: Award },
];

export function Sidebar({ terminal = "Terminal 4", subtitle = "FIELD OPERATIONS" }: { terminal?: string; subtitle?: string }) {
  const logout = useAuth().logout;

  return (
    <aside className="w-60 shrink-0 flex-col border-r border-border bg-card lg:flex" >
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((it, i) => (
          <NavLink
            key={i}
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
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition hover:bg-primary-deep">
          <FilePlus2 className="h-4 w-4" /> Request Certification
        </button>
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
