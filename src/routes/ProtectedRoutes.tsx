import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthenticationContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute check: ", { user, loading });

  if (loading) {
    return <p>Checking session...</p>;
  }

   

  if (!user || (typeof user === "string" && user.trim().startsWith("<!doctype"))) {
    console.log("No user found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  
  return <Outlet />;
}
