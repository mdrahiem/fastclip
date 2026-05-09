// apps/web/app/App.tsx

import { RootRoute, Router, RootRouteWithoutChildren } from "@tanstack/react-router";
import { RouterProvider, Outlet } from "@tanstack/react-router";
import "./index.css";

// Root layout component
function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            We Are Hiring - Video Generator
          </h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

// Create root route
const rootRoute = new RootRoute({
  component: RootLayout,
});

// Import routes dynamically or create them here
// For now, create a placeholder router
const router = new Router({
  routeTree: rootRoute,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
