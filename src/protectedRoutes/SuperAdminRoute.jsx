import React from "react";
 import { Navigate, Outlet } from "react-router-dom";
 import { useAuth } from "./AuthContext";
 
 const SuperAdminRoute = () => {
   const { user } = useAuth();
  console.log(user.isSuperAdmin);
   if (user && user.isSuperAdmin === true) {
     return <Outlet />;
   } else {
     // Redirect non-superAdmin users to dashboard
     return <Navigate to="/dashboard" replace />;
   }
 };
 
 export default SuperAdminRoute;