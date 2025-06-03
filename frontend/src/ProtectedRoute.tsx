import { Navigate, Outlet } from "react-router";
import useAuthStore from "@/hooks/zustand/useAuthStore";

export default function ProtectedRoute() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
