// ─── components/pages/AuthPage.jsx ───────────────────────────────────────────
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useDocumentTitle } from "../../hooks/index.js";

export default function AuthPage({ mode: initialMode = "login" }) {
  useDocumentTitle(initialMode === "login" ? "Log In" : "Sign Up");

  const [mode, setMode]       = useState(initialMode);
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { addToast }        = useToast();
  const navigate            = useNavigate();

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (mode === "signup" && !form.name.trim())
      e.name = "Name is required";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Valid email required";
    if (!form.password || form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    return e;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        addToast("Welcome back! 👋", "success");
      } else {
        await register(form.name, form.email, form.password);
        addToast("Account created! Let's learn 🧠", "success");
      }
      navigate("/dashboard");
    } catch (err) {
      addToast(err.message, "error");
      setErrors({ api: err.message });
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
        {label}
      </label>
      <input
        className={`input ${errors[key] ? "input-error" : ""}`}
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: "" }));
        }}
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "name"}
      />
      {errors[key] && (
        <span style={{ fontSize: 12, color: "var(--coral)" }}>{errors[key]}</span>
      )}
    </div>
  );

  return (
    <div className="auth-bg">
      <div className="auth-card animate-fade">
        {/* Branding */}
        <div className="text-center mb-32">
          <div style={{ fontSize: 44, marginBottom: 12 }}>🧠</div>
          <h1 className="hero-text" style={{ fontSize: 26 }}>
            Quiz<span className="grad-text">IQ</span>
          </h1>
          <p className="text-muted text-sm" style={{ marginTop: 6 }}>
            AI-powered adaptive learning system
          </p>
        </div>

        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "var(--radius-full)",
            padding: 4,
            marginBottom: 28,
          }}
        >
          {["login", "signup"].map((m) => (
            <button
              key={m}
              className="btn"
              style={{
                flex: 1,
                borderRadius: "var(--radius-full)",
                padding: "8px 0",
                fontSize: 14,
                justifyContent: "center",
                background: mode === m ? "var(--violet)" : "transparent",
                color: mode === m ? "white" : "var(--text-3)",
                boxShadow: mode === m ? "var(--shadow-violet)" : "none",
              }}
              onClick={() => {
                setMode(m);
                setErrors({});
              }}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* API error */}
        {errors.api && (
          <div
            style={{
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.3)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--coral)",
              marginBottom: 16,
            }}
          >
            {errors.api}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && field("name", "Full Name", "text", "Jane Smith")}
          {field("email", "Email", "email", "you@example.com")}
          {field("password", "Password", "password", "••••••••")}

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 8 }}
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log In →"
              : "Create Account →"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div className="divider" style={{ margin: 0, flex: 1 }} />
          <span className="text-dim text-sm">or</span>
          <div className="divider" style={{ margin: 0, flex: 1 }} />
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-dim">
          {mode === "login" ? "No account? " : "Already have one? "}
          <button
            className="btn btn-ghost btn-sm"
            style={{ border: "none", color: "var(--violet-light)", padding: "2px 6px" }}
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}
          >
            {mode === "login" ? "Sign up free" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
