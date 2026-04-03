// ─── components/pages/TopicPage.jsx ──────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { quizAPI } from "../../api/services.js";
import { TOPICS } from "../../data/constants.js";
import { useDocumentTitle } from "../../hooks/index.js";

export default function TopicPage() {
  useDocumentTitle("Choose Topic");

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [selected, setSelected] = useState(params.get("topic") || null);
  const [mode, setMode] = useState("timed");
  const [questionCounts, setQuestionCounts] = useState({}); // { topic: count }
  const [loadingCounts, setLoadingCounts] = useState(true);

  // ── Fetch question counts for all topics ──────────────────────────────────────
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await quizAPI.getQuestionCounts();
        setQuestionCounts(res.data.counts);
      } catch (err) {
        console.error("Failed to fetch question counts:", err);
        // Fallback: show 0 if fetch fails
        setQuestionCounts({});
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchCounts();
  }, []);

  const handleStart = () => {
    if (!selected) return;
    navigate(`/quiz/${selected}?mode=${mode}`);
  };

  return (
    <div className="page page-narrow animate-fade">
      <button className="btn btn-ghost btn-sm mb-24" onClick={() => navigate("/dashboard")}>
        ← Back
      </button>

      <div className="mb-32">
        <h2 className="hero-text" style={{ fontSize: 26 }}>Choose Your Topic</h2>
        <p className="text-muted text-sm mt-8">
          The AI adapts question difficulty to your live performance
        </p>
      </div>

      {/* Topic grid */}
      <div className="grid-2 mb-32">
        {TOPICS.map((t) => {
          const count = questionCounts[t.id] || 0;
          return (
            <div
              key={t.id}
              className={`topic-card ${selected === t.id ? "selected" : ""}`}
              style={{ "--topic-grad": `linear-gradient(135deg,${t.color},transparent)` }}
              onClick={() => setSelected(t.id)}
            >
              <div className="flex items-center gap-12">
                <div
                  className="topic-icon"
                  style={{
                    background: `${t.color}18`,
                    borderColor: `${t.color}30`,
                    fontSize: 28, width: 56, height: 56,
                  }}
                >
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 600, fontSize: 16 }}>
                    {t.label}
                  </div>
                  <div className="text-dim text-sm">{t.desc}</div>
                  <div className="text-dim text-sm" style={{ marginTop: 4 }}>
                    {loadingCounts ? "Loading..." : `${count} questions`} · Easy → Hard
                  </div>
                </div>
              </div>
              {selected === t.id && (
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "var(--violet)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    ✓
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mode selector */}
      <div className="mb-32">
        <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Quiz Mode</div>
        <div className="flex gap-12">
          {[
            { id: "timed", label: "⏱ Timed", desc: "30s per question" },
            { id: "practice", label: "🎯 Practice", desc: "No time limit" },
          ].map((m) => (
            <button
              key={m.id}
              className={`btn ${mode === m.id ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1, flexDirection: "column", gap: 4, padding: "14px 20px", height: "auto" }}
              onClick={() => setMode(m.id)}
            >
              <span>{m.label}</span>
              <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 400 }}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div
        className="card mb-32"
        style={{ background: "rgba(108,59,255,0.06)", borderColor: "rgba(108,59,255,0.2)" }}
      >
        <div className="flex gap-12" style={{ alignItems: "flex-start" }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>How Adaptive Learning Works</div>
            <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
              Start at <span className="badge badge-easy">Easy</span>. Answer 3 correctly with avg
              response &lt;12s → promoted to <span className="badge badge-medium">Medium</span>.
              Then to <span className="badge badge-hard">Hard</span>. Two incorrect in a row →
              demoted. Your XP reward scales with difficulty and speed.
            </div>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg btn-full"
        disabled={!selected}
        onClick={handleStart}
      >
        {selected
          ? `Start ${TOPICS.find((t) => t.id === selected)?.label} Quiz →`
          : "Select a topic to continue"}
      </button>
    </div>
  );
}
