import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Sidebar, SidebarContent } from "./Sidebar";
import { AdminTopNav } from "./AdminTopNav";
import { Logo } from "./Logo";

export function AdminPageShell({ children, withSidebar = false, searchPlaceholder }: { children: React.ReactNode; withSidebar?: boolean; searchPlaceholder?: string }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  // Close the drawer on route change + lock body scroll while it's open.
  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen, closeMobileNav]);

  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ backgroundColor: "#f7f8f9" }}>
      <AdminTopNav
        searchPlaceholder={searchPlaceholder}
        onMenuClick={withSidebar ? () => setMobileNavOpen(true) : undefined}
      />
      <div className="mx-auto flex w-full flex-1">
        {withSidebar && <Sidebar />}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile / tablet drawer nav (below lg). Reuses the same role-aware links. */}
      {withSidebar && mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-80 flex-col bg-card shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
              <Logo />
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Close navigation menu"
                className="grid h-10 w-10 place-items-center rounded-md text-foreground/70 transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent onNavigate={closeMobileNav} />
            </div>
          </div>
        </div>
      )}

      {/* <Footer /> */}
    </div>
  );
}
