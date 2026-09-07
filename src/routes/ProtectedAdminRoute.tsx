import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthenticationContext";

export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute check: ", { user, loading });

  if (loading) {
    return <p>Checking session...</p>;
  }

   
  if(user.role != 'admin')
  {
    return <Navigate to='/orders' replace />;
  }

  
  return <Outlet />;
}
