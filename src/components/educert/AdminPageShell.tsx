import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { AdminTopNav } from "./AdminTopNav";
import { useAuth } from "@/context/AuthContext";

const normalizeRole = (role?: string) => (role || "").toUpperCase();

export function AdminPageShell({ children, withSidebar = false, searchPlaceholder }: { children: React.ReactNode; withSidebar?: boolean; searchPlaceholder?: string }) {
  const { user } = useAuth() as { user: { role?: string } | null };
  const role = normalizeRole(user?.role);

  // Non-admin roles never see admin-only sidebar entries — Sidebar itself is
  // role-aware, but hide the whole sidebar column for trainees as a safeguard
  // (trainers keep a sidebar, just with "My Courses" etc.).

  return (
    <div className="flex min-h-screen flex-col bg-background" style={{backgroundColor: '#f7f8f9', }}>
      <AdminTopNav searchPlaceholder={searchPlaceholder} />
        <div className="mx-auto flex w-full flex-1">
          {withSidebar && <Sidebar />}
          <main className="px-6 py-10 lg:px-10 flex-1 min-w-0" style={{ height: 'calc(100vh - 64px)', overflow: 'auto'}}>{children}</main>
        </div>
     
      {/* <Footer /> */}
    </div>
  );
}
