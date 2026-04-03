// ─── App.jsx — Root Router ────────────────────────────────────────────────────
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AIGeneratorPage from "./components/pages/AIGeneratorPage.jsx";
import ProtectedRoute  from "./components/layout/ProtectedRoute.jsx";
import AuthPage        from "./components/pages/AuthPage.jsx";
import DashboardPage   from "./components/pages/DashboardPage.jsx";
import TopicPage       from "./components/pages/TopicPage.jsx";
import QuizPage        from "./components/pages/QuizPage.jsx";
import ResultsPage     from "./components/pages/ResultsPage.jsx";
import ProfilePage     from "./components/pages/ProfilePage.jsx";
import NotFoundPage    from "./components/pages/NotFoundPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="signup" />} />

          {/* Protected routes — wrapped in ProtectedRoute (renders Navbar + Outlet) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/quiz"           element={<TopicPage />} />
            <Route path="/quiz/:topic"    element={<QuizPage />} />
            <Route path="/results"        element={<ResultsPage />} />
            <Route path="/profile"        element={<ProfilePage />} />
            <Route path="/ai-generator" element={<AIGeneratorPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/"   element={<Navigate to="/dashboard" replace />} />
          <Route path="*"   element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
