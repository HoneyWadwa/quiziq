// ─── components/ui/ProgressBar.jsx ───────────────────────────────────────────

export default function ProgressBar({
  value,        // 0–100
  gradient,     // optional custom gradient string
  height = 6,
  showGlow = false,
  style = {},
}) {
  const bg = gradient || "var(--grad-violet)";

  return (
    <div
      className="progress-track"
      style={{ height, ...style }}
    >
      <div
        className="progress-fill"
        style={{
          width: `${Math.max(Math.min(value, 100), 0)}%`,
          background: bg,
          boxShadow: showGlow ? `0 0 8px ${bg}` : "none",
        }}
      />
    </div>
  );
}
