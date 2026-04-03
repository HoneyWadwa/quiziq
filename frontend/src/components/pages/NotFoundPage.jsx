// ─── components/pages/NotFoundPage.jsx ───────────────────────────────────────
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 64 }}>🤔</div>
      <h1
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        Page Not Found
      </h1>
      <p style={{ color: "var(--text-3)", fontSize: 15 }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link className="btn btn-primary" to="/dashboard">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
