import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TitleBar } from "@/components/title-bar";
import { Sidebar } from "@/components/sidebar";

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col rounded-xl my-2 mr-2 overflow-hidden shadow-xl app-frame">
        <TitleBar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  ),
});
