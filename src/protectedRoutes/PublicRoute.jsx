import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PublicRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const redirectPath = new URLSearchParams(location.search).get("redirect") || "/dashboard";

    if (isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
