import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TitleBar } from "@/components/title-bar";
import { Sidebar } from "@/components/sidebar";

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  ),
});
