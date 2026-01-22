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
      // Database route - independent section
      {
        path: "/database",
        lazy: () => import("./Database"),
      },
      {
        path: "/database/cards/:cardId",
        lazy: () => import("./Database/CardDetail"),
      },
      // Deck management routes
      {
        path: "/decks",
        lazy: () => import("./Decks"),
      },
      // Build new deck (must be before :deckName to avoid conflict)
      {
        path: "/decks/build",
        lazy: () => import("./Decks/Build"),
      },
      {
        path: "/decks/build/cards/:cardId",
        lazy: () => import("./Decks/CardView"),
      },
      // Edit existing deck
      {
        path: "/decks/:deckName",
        lazy: () => import("./Decks/Edit"),
      },
      {
        path: "/decks/:deckName/cards/:cardId",
        lazy: () => import("./Decks/CardView"),
      },
      // Legacy route - keep for testing, remove later
      {
        path: "/build",
        lazy: () => import("./Decks/BuildDeck"),
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

import { Loading } from "@/ui/Shared";

export const NeosRouter = () => <RouterProvider router={router} fallbackElement={<Loading overlay />} />;
