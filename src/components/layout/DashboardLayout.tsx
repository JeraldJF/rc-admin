import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      {/* Spacer matches fixed sidebar width so content doesn't render under it */}
      <div className="w-64 shrink-0" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-50">
          <TopBar title={title} />
        </div>
        <main className="flex-1 p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
