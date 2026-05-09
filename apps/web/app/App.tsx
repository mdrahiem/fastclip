// apps/web/app/App.tsx

import {
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import "./index.css";
import IndexPage from "./routes/index";
import DashboardPage from "./routes/dashboard/$jobId";
import EditPage from "./routes/edit/$jobId";

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            We Are Hiring — Video Generator
          </h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/$jobId",
  component: DashboardPage,
});

const editRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit/$jobId",
  component: EditPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  editRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
