// ─── components/layout/Navbar.jsx ────────────────────────────────────────────
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="nav">
      {/* Logo */}
      <Link to="/dashboard" className="nav-logo">
        <div className="nav-logo-icon">🧠</div>
        <span>Quiz<span className="grad-text">IQ</span></span>
      </Link>

      {/* Actions */}
      {user && (
        <div className="flex items-center gap-12">
          <Link to="/quiz" className="btn btn-primary btn-sm hide-mobile">
            ▶ Start Quiz
          </Link>

          <Link to="/profile" className="nav-user" style={{ textDecoration: "none" }}>
            <div className="avatar">{user.name[0].toUpperCase()}</div>
            <span className="text-sm font-semibold hide-mobile">{user.name.split(" ")[0]}</span>
            <span className="badge badge-violet hide-mobile" style={{ fontSize: 11 }}>
              Lv.{user.level}
            </span>
          </Link>

          <Link to="/ai-generator">🤖 AI Generator</Link>
          
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            title="Log out"
          >
            ↩
          </button>
        </div>
      )}
    </nav>
  );
}
