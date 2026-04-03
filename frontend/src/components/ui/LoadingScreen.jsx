// ─── components/ui/LoadingScreen.jsx ─────────────────────────────────────────
export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "var(--dark)",
      }}
    >
      {/* Pulsing brain */}
      <div style={{ fontSize: 48, animation: "pulse 1.5s ease infinite" }}>🧠</div>

      {/* Spinner ring */}
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="rgba(108,59,255,0.2)"
          strokeWidth="4"
        />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="var(--violet)"
          strokeWidth="4"
          strokeDasharray="40 90"
          strokeLinecap="round"
          style={{
            transformOrigin: "center",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>

      <p style={{ color: "var(--text-3)", fontSize: 14 }}>{message}</p>
    </div>
  );
}
