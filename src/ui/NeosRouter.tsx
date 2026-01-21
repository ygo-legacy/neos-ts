import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { Component as LayoutComponent, loader as layoutLoader } from "./Layout";

const router = createBrowserRouter([
  // Public route - Login page (outside of Layout)
  {
    path: "/login",
    lazy: () => import("./Login"),
  },
  // Protected routes - wrapped in Layout
  {
    path: "/",
    Component: LayoutComponent,
    loader: layoutLoader,
    children: [
      {
        path: "/",
        lazy: () => import("./Start"),
      },
      {
        path: "/match/*",
        lazy: () => import("./Match"),
      },
      {
        path: "/build",
        lazy: () => import("./BuildDeck"),
      },
      {
        path: "/waitroom",
        lazy: () => import("./WaitRoom"),
      },
      {
        path: "/duel",
        lazy: () => import("./Duel/Main"),
      },
      {
        path: "/side",
        lazy: () => import("./Side"),
      },
    ],
  },
  // Catch-all redirect to start
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export const NeosRouter = () => <RouterProvider router={router} />;
