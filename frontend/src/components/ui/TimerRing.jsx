// ─── components/ui/TimerRing.jsx ─────────────────────────────────────────────
export default function TimerRing({ elapsed, limit }) {
  const timeLeft   = Math.max(limit - elapsed, 0);
  const pct        = timeLeft / limit;
  const radius     = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  const color =
    timeLeft <= 10 ? "var(--coral)" :
    timeLeft <= 20 ? "var(--amber)" :
    "var(--violet)";

  return (
    <div className="timer-ring">
      <svg width="70" height="70" viewBox="0 0 70 70">
        {/* Track */}
        <circle
          cx="35" cy="35" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        {/* Progress arc */}
        <circle
          cx="35" cy="35" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <div
        className="timer-ring-text"
        style={{ color: timeLeft <= 10 ? "var(--coral)" : "var(--text-1)" }}
      >
        {timeLeft}
      </div>
    </div>
  );
}
