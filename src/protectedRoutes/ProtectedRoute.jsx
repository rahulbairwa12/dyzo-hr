import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { checkPlans } from "@/context/PlanCheck";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 
