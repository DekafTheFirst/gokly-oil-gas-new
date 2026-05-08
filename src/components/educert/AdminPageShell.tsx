import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { AdminTopNav } from "./AdminTopNav";

export function AdminPageShell({ children, withSidebar = false, searchPlaceholder }: { children: React.ReactNode; withSidebar?: boolean; searchPlaceholder?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background" style={{backgroundColor: '#f7f8f9', }}>
      <AdminTopNav searchPlaceholder={searchPlaceholder} />
        <div className="mx-auto flex w-full flex-1">
          {withSidebar && <Sidebar />}
          <main className="px-6 py-10 lg:px-10 flex-1" style={{ height: 'calc(100vh - 64px)', overflow: 'auto'}}>{children}</main>
        </div>
     
      {/* <Footer /> */}
    </div>
  );
}
