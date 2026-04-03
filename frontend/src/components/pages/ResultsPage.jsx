// ─── components/pages/ResultsPage.jsx ────────────────────────────────────────
import { useLocation, useNavigate } from "react-router-dom";
import { TOPICS } from "../../data/constants.js";
import ProgressBar from "../ui/ProgressBar.jsx";
import { useDocumentTitle } from "../../hooks/index.js";

export default function ResultsPage() {
  useDocumentTitle("Quiz Results");

  const { state } = useLocation();
  const navigate  = useNavigate();

  // Guard: if someone navigates here directly with no state
  if (!state) {
    navigate("/dashboard");
    return null;
  }

  const { score, total, xpEarned, topic, mode, finalDifficulty, history = [] } = state;

  const accuracy = Math.round((score / total) * 100);
  const topicMeta = TOPICS.find((t) => t.id === topic);
  const avgTime = history.length
    ? Math.round(history.reduce((s, h) => s + (h.timeSpent || 0), 0) / history.length)
    : 0;

  // Grade
  const grade =
    accuracy >= 90 ? { label: "Exceptional!",     icon: "🏆", color: "var(--mint)"  } :
    accuracy >= 75 ? { label: "Great Job!",        icon: "🎉", color: "var(--cyan)"  } :
    accuracy >= 60 ? { label: "Good Effort!",      icon: "💪", color: "var(--amber)" } :
                     { label: "Keep Practising",   icon: "📚", color: "var(--coral)" };

  // Difficulty breakdown
  const diffStats = ["easy", "medium", "hard"].map((d) => {
    const qs = history.filter((h) => h.difficulty === d);
    return {
      label: d,
      total: qs.length,
      correct: qs.filter((h) => h.correct).length,
      accuracy: qs.length ? Math.round((qs.filter((h) => h.correct).length / qs.length) * 100) : 0,
    };
  }).filter((d) => d.total > 0);

  const diffGrad = (label) =>
    label === "easy"   ? "var(--grad-mint)" :
    label === "medium" ? "linear-gradient(90deg,var(--amber),#FF8E53)" :
    "var(--grad-coral)";

  return (
    <div className="page page-narrow animate-fade" style={{ maxWidth: 640 }}>
      {/* ── Grade header ── */}
      <div className="text-center mb-32">
        <div style={{ fontSize: 52, marginBottom: 12, animation: "bounce 1s ease infinite" }}>
          {grade.icon}
        </div>
        <h1 className="hero-text" style={{ fontSize: 28, color: grade.color }}>
          {grade.label}
        </h1>
        <p className="text-muted text-sm mt-8">
          {topicMeta?.icon} {topicMeta?.label} ·{" "}
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Score ring ── */}
      <div className="result-circle mb-32">
        <div className="result-score" style={{ color: grade.color }}>{accuracy}%</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
          {score}/{total} correct
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid-3 mb-24">
        {[
          { icon: "⚡", value: `+${xpEarned}`, label: "XP Earned",   color: "var(--amber)" },
          { icon: "⏱", value: `${avgTime}s`,   label: "Avg. Time",   color: "var(--cyan)"  },
          { icon: "🎯", value: finalDifficulty, label: "Final Level", color: "var(--mint)"  },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div
              className="stat-value"
              style={{ color: s.color, fontSize: 22, textTransform: "capitalize" }}
            >
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Difficulty breakdown ── */}
      {diffStats.length > 0 && (
        <div className="card mb-24">
          <div className="section-title" style={{ fontSize: 16, marginBottom: 16 }}>
            Difficulty Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {diffStats.map((d) => (
              <div key={d.label} className="flex items-center gap-12">
                <span
                  className={`badge badge-${d.label}`}
                  style={{ minWidth: 72, justifyContent: "center", textTransform: "capitalize" }}
                >
                  {d.label}
                </span>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={d.accuracy} gradient={diffGrad(d.label)} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>
                  {d.accuracy}%
                </span>
                <span className="text-dim text-sm" style={{ minWidth: 42 }}>
                  ({d.total}q)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Study tip ── */}
      {accuracy < 70 && (
        <div className="explanation-box mb-24">
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>💡 Study Tip</div>
          Review the concepts you missed and try Practice Mode to focus without time pressure.
          Consistent daily attempts build the strongest retention.
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={() => navigate(`/quiz/${topic}?mode=${mode}`)}
        >
          🔄 Retry {topicMeta?.label}
        </button>
        <div className="flex gap-12">
          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate("/quiz")}
          >
            📚 New Topic
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => navigate("/dashboard")}
          >
            📊 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
