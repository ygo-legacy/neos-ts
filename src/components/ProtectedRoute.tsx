import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSnapshot } from "valtio";

import { accountStore } from "@/stores";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Route guard that redirects to /login if user is not authenticated.
 * Used to protect routes that require authentication.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useSnapshot(accountStore);
    const location = useLocation();

    // While loading auth state, show nothing (or could show a spinner)
    if (isLoading) {
        return null;
    }

    // If not authenticated, redirect to login with return URL
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
};
