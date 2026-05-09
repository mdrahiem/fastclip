// apps/web/app/App.tsx

import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import "./index.css";
import IndexPage from "./routes/index";
import DashboardPage from "./routes/dashboard/$jobId";
import EditPage from "./routes/edit/$jobId";

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

// Create router
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <IndexPage />,
      },
      {
        path: "/dashboard/:jobId",
        element: <DashboardPage />,
      },
      {
        path: "/edit/:jobId",
        element: <EditPage />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
