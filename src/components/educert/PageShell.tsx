import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

export function PageShell({ children, withSidebar = false, searchPlaceholder }: { children: React.ReactNode; withSidebar?: boolean; searchPlaceholder?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav searchPlaceholder={searchPlaceholder} />
      {withSidebar ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-1">
          <Sidebar />
          <main className="flex-1 px-6 py-10 lg:px-10">{children}</main>
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}
      <Footer />
    </div>
  );
}
