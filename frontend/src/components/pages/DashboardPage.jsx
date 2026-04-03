// ─── components/pages/DashboardPage.jsx ──────────────────────────────────────
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { userAPI, quizAPI } from "../../api/services.js";
import { TOPICS } from "../../data/constants.js";
import XPLevelCard from "../ui/XPLevelCard.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { DashboardSkeleton } from "../ui/Skeleton.jsx";
import { useDocumentTitle } from "../../hooks/index.js";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionCounts, setQuestionCounts] = useState({}); // { topic: count }
  const [countsLoading, setCountsLoading] = useState(true); // Separate loading state for counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAnalytics, resCounts] = await Promise.all([
          userAPI.getAnalytics(),
          quizAPI.getQuestionCounts(),
        ]);
        setAnalytics(resAnalytics.analytics);
        setQuestionCounts(resCounts.counts);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set fallback values
        setAnalytics({ recentSessions: [], topicBreakdown: [], weakAreas: [] });
        setQuestionCounts({}); // Fallback to empty object
      } finally {
        setLoading(false);
        setCountsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const accuracy = user.totalQuestions
    ? Math.round((user.totalCorrect / user.totalQuestions) * 100)
    : 0;

  // Build a 7-point weekly accuracy sparkline from recent sessions
  const weekData = analytics?.recentSessions?.length
    ? analytics.recentSessions.slice(-7).map((s) => s.accuracy)
    : [0];

  const topicBreakdown = analytics?.topicBreakdown || [];
  const weakAreas = analytics?.weakAreas || [];

  return (
    <div className="page animate-fade">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-32" style={{ flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="hero-text" style={{ fontSize: 28 }}>
            Welcome back, <span className="grad-text">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>
            Keep the momentum going. Your streak is looking great!
          </p>
        </div>
        <div className="flex gap-12" style={{ flexWrap: "wrap" }}>
          <div className="streak-badge">🔥 {user.streak} day streak</div>
          <Link className="btn btn-primary" to="/quiz">▶ Start Quiz</Link>
        </div>
      </div>

      {/* ── XP + Level ── */}
      <XPLevelCard user={user} />

      {/* ── Stats grid ── */}
      <div className="grid-4 mb-24">
        {[
          { label: "Quizzes Taken", value: user.totalQuizzes, icon: "📝", color: "var(--violet)" },
          { label: "Accuracy", value: `${accuracy}%`, icon: "🎯", color: "var(--mint)" },
          { label: "XP Earned", value: user.xp.toLocaleString(), icon: "⚡", color: "var(--amber)" },
          { label: "Day Streak", value: user.streak, icon: "🔥", color: "var(--coral)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Topic Performance + Weekly Chart ── */}
      <div className="grid-2 mb-24">
        {/* Topic accuracy bars */}
        <div className="card">
          <div className="section-title mb-8">Topic Performance</div>
          <div className="section-sub">Your accuracy by subject</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {TOPICS.map((t) => {
              const stat = topicBreakdown.find((tb) => tb.topic === t.id);
              const acc = stat ? Math.round(stat.accuracy) : 0;
              const grad =
                acc >= 70
                  ? "var(--grad-mint)"
                  : acc >= 50
                    ? "linear-gradient(90deg,var(--amber),#FF8E53)"
                    : "var(--grad-coral)";

              return (
                <div key={t.id}>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-8">
                      <span style={{ fontSize: 16 }}>{t.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-dim text-sm">
                        {stat ? stat.sessions : 0} sessions
                      </span>
                      <span
                        style={{
                          fontSize: 13, fontWeight: 600,
                          color: acc >= 70 ? "var(--mint)" : acc >= 50 ? "var(--amber)" : "var(--coral)",
                        }}
                      >
                        {stat ? `${acc}%` : "—"}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={acc} gradient={grad} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly chart + weak areas */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="section-title mb-8">Weekly Activity</div>
          <div className="section-sub">Accuracy over last sessions</div>

          {/* Mini bar chart */}
          <div
            style={{
              display: "flex", alignItems: "flex-end", gap: 6,
              height: 120, marginBottom: 8,
            }}
          >
            {(weekData.length < 7
              ? [...Array(7 - weekData.length).fill(0), ...weekData]
              : weekData
            ).map((v, i, arr) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(v, 4)}%`,
                  borderRadius: "4px 4px 0 0",
                  background: i === arr.length - 1 ? "var(--grad-cyan)" : "var(--grad-violet)",
                  opacity: i === arr.length - 1 ? 1 : 0.4 + i * 0.08,
                  transition: "height 1s ease",
                  minHeight: 4,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between" style={{ marginBottom: 20 }}>
            {["M", "T", "W", "T", "F", "S", "T"].map((d, i) => (
              <span key={i} className="text-dim" style={{ fontSize: 11, flex: 1, textAlign: "center" }}>
                {d}
              </span>
            ))}
          </div>

          <div className="divider" style={{ margin: "0 0 16px" }} />

          {/* Weak areas */}
          <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>
            Weak Areas
          </div>
          {weakAreas.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              🎉 No weak areas detected yet!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {weakAreas.map((w) => {
                const topic = TOPICS.find((t) => t.id === w.topic);
                return (
                  <div
                    key={w.topic}
                    className="flex items-center justify-between"
                    style={{
                      padding: "10px 12px",
                      background: "rgba(255,107,107,0.08)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid rgba(255,107,107,0.15)",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {topic?.icon} {topic?.label || w.topic}
                    </span>
                    <span className="badge badge-hard">{w.accuracy}% accuracy</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick-start topic grid ── */}
      <div className="section-title mb-8">Quick Start</div>
      <div className="section-sub">Pick a topic to practise</div>
      <div className="grid-4">
        {TOPICS.map((t) => {
          const stat = topicBreakdown.find((tb) => tb.topic === t.id);
          return (
            <div
              key={t.id}
              className="topic-card"
              style={{ "--topic-grad": `linear-gradient(135deg,${t.color},transparent)` }}
              onClick={() => navigate(`/quiz?topic=${t.id}`)}
            >
              <div
                className="topic-icon"
                style={{ background: `${t.color}18`, borderColor: `${t.color}30`, fontSize: 28 }}
              >
                {t.icon}
              </div>
              <div>
                <div className="topic-title" style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 600 }}>
                  {t.label}
                </div>
                <div className="topic-meta text-dim text-sm">{t.desc}</div>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="text-dim text-sm">
                  {countsLoading ? "Loading..." : `${questionCounts[t.id] || 0} questions`}
                </span>
                {stat && (
                  <span
                    className="badge"
                    style={{
                      fontSize: 11,
                      background: `${t.color}15`,
                      color: t.color,
                      border: `1px solid ${t.color}30`,
                    }}
                  >
                    {Math.round(stat.accuracy)}% acc.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
