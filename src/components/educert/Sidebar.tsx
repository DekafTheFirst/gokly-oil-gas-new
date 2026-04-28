import { Link } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, BarChart3, BadgeCheck, Settings, LogOut, ClipboardList, FilePlus2, type LucideIcon } from "lucide-react";

type Item = { to: "/dashboard" | "/courses" | "/admin" | "/verify"; label: string; icon: LucideIcon };

const items: Item[] = [
  { to: "/dashboard", label: "Training Modules", icon: BookOpen },
  { to: "/admin", label: "Admin Panel", icon: ShieldCheck },
  { to: "/verify", label: "Safety Reports", icon: ClipboardList },
  { to: "/courses", label: "Analytics", icon: BarChart3 },
  { to: "/admin", label: "Compliance", icon: BadgeCheck },
];

export function Sidebar({ terminal = "Terminal 4", subtitle = "FIELD OPERATIONS" }: { terminal?: string; subtitle?: string }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-6 py-6">
        <p className="font-display text-lg font-bold leading-tight">{terminal}</p>
        <p className="label-eyebrow mt-1">{subtitle}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((it, i) => (
          <Link
            key={i}
            to={it.to}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/75 transition hover:bg-muted"
            activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
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
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </div>
    </aside>
  );
}
