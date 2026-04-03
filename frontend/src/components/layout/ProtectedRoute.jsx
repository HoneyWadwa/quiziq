// ─── components/layout/ProtectedRoute.jsx ────────────────────────────────────
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import LoadingScreen from "../ui/LoadingScreen.jsx";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <Navbar />
      <Outlet />
    </div>
  );
}
