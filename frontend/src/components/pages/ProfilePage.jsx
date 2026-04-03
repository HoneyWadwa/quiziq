// ─── components/pages/ProfilePage.jsx ────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { userAPI } from "../../api/services.js";
import { TOPICS, levelLabel, levelIcon } from "../../data/constants.js";
import XPLevelCard from "../ui/XPLevelCard.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";
import { useDocumentTitle } from "../../hooks/index.js";

const ACHIEVEMENTS = [
  { icon: "🔥", label: "Streak Keeper",  check: (u) => u.streak >= 3 },
  { icon: "🧠", label: "Brainiac",       check: (u) => u.totalCorrect >= 50 },
  { icon: "⚡", label: "Speed Demon",    check: (u) => u.xp >= 100 },
  { icon: "🎯", label: "Sharpshooter",   check: (u) => u.totalQuizzes >= 5 },
  { icon: "📈", label: "Grinder",        check: (u) => u.totalQuizzes >= 10 },
  { icon: "👑", label: "Master",         check: (u) => u.level >= 5 },
];

export default function ProfilePage() {
  useDocumentTitle("Profile");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState(null);
  const [analytics, setAnalytics]     = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([userAPI.getLeaderboard(), userAPI.getAnalytics()])
      .then(([lb, an]) => {
        setLeaderboard(lb);
        setAnalytics(an.analytics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const accuracy = user.totalQuestions
    ? Math.round((user.totalCorrect / user.totalQuestions) * 100)
    : 0;

  return (
    <div className="page animate-fade" style={{ maxWidth: 800 }}>
      <button className="btn btn-ghost btn-sm mb-24" onClick={() => navigate("/dashboard")}>
        ← Back
      </button>

      {/* ── Header ── */}
      <div className="flex items-center gap-16 mb-32" style={{ flexWrap: "wrap" }}>
        <div
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--grad-violet)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, boxShadow: "var(--shadow-violet)",
          }}
        >
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h2 className="section-title" style={{ fontSize: 22 }}>{user.name}</h2>
          <p className="text-muted text-sm">{user.email}</p>
          <div className="flex gap-8 mt-8">
            <span className="badge badge-violet">Level {user.level} · {levelLabel(user.level)}</span>
            <span className="streak-badge" style={{ fontSize: 12, padding: "3px 10px" }}>
              🔥 {user.streak} day streak
            </span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={() => { logout(); navigate("/login"); }}
        >
          Log out ↩
        </button>
      </div>

      {/* ── XP Card ── */}
      <XPLevelCard user={user} />

      {/* ── Stats grid ── */}
      <div className="grid-4 mb-32">
        {[
          { label: "Total XP",   value: user.xp.toLocaleString(), icon: "⚡" },
          { label: "Quizzes",    value: user.totalQuizzes,          icon: "📝" },
          { label: "Accuracy",   value: `${accuracy}%`,             icon: "🎯" },
          { label: "Level",      value: user.level,                 icon: "🎖" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        {/* ── Achievements ── */}
        <div className="card">
          <div className="section-title" style={{ fontSize: 16, marginBottom: 16 }}>
            Achievement Badges
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {ACHIEVEMENTS.map((a) => {
              const earned = a.check(user);
              return (
                <div
                  key={a.label}
                  title={a.label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-lg)",
                    background: earned ? "rgba(108,59,255,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${earned ? "rgba(108,59,255,0.3)" : "var(--border)"}`,
                    opacity: earned ? 1 : 0.35,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 6, width: 82,
                    cursor: "default",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{a.icon}</span>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 500, textAlign: "center",
                      color: earned ? "var(--violet-light)" : "var(--text-3)",
                      lineHeight: 1.3,
                    }}
                  >
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Topic breakdown ── */}
        <div className="card">
          <div className="section-title" style={{ fontSize: 16, marginBottom: 16 }}>
            Topic Accuracy
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} height={14} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {TOPICS.map((t) => {
                const stat = analytics?.topicBreakdown?.find((tb) => tb.topic === t.id);
                const acc = stat ? Math.round(stat.accuracy) : 0;
                return (
                  <div key={t.id}>
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-8">
                        <span>{t.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 13, fontWeight: 600,
                          color: acc >= 70 ? "var(--mint)" : acc >= 50 ? "var(--amber)" : "var(--coral)",
                        }}
                      >
                        {stat ? `${acc}%` : "—"}
                      </span>
                    </div>
                    <ProgressBar
                      value={acc}
                      gradient={
                        acc >= 70
                          ? "var(--grad-mint)"
                          : acc >= 50
                          ? "linear-gradient(90deg,var(--amber),#FF8E53)"
                          : "var(--grad-coral)"
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <div className="card mb-24">
        <div className="section-title" style={{ fontSize: 16, marginBottom: 4 }}>
          🏆 Global Leaderboard
        </div>
        <div className="section-sub">Top learners by XP</div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={44} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leaderboard?.leaderboard?.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: entry.isMe
                    ? "rgba(108,59,255,0.12)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${entry.isMe ? "rgba(108,59,255,0.3)" : "var(--border)"}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "Space Grotesk,sans-serif",
                    fontWeight: 700, fontSize: 14,
                    color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "var(--text-3)",
                    minWidth: 24,
                  }}
                >
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </span>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: entry.isMe ? "var(--grad-violet)" : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  {entry.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {entry.name} {entry.isMe && <span className="badge badge-violet" style={{ fontSize: 10, padding: "2px 6px" }}>You</span>}
                  </div>
                  <div className="text-dim text-sm">
                    Level {entry.level} · {entry.streak}🔥 streak
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "Space Grotesk,sans-serif",
                    fontWeight: 700, fontSize: 15,
                    color: "var(--cyan)",
                  }}
                >
                  {entry.xp.toLocaleString()} XP
                </div>
              </div>
            ))}
            {leaderboard?.myRank > 10 && (
              <div className="text-center text-sm text-dim" style={{ paddingTop: 8 }}>
                Your rank: #{leaderboard.myRank}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Algorithm info ── */}
      <div className="card">
        <div className="section-title" style={{ fontSize: 16, marginBottom: 4 }}>
          Adaptive Algorithm Rules
        </div>
        <div className="section-sub">How difficulty is chosen for you</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { emoji: "🟢", label: "Promote Easy → Medium", rule: "3 correct in a row + avg time < 12s" },
            { emoji: "🟡", label: "Promote Medium → Hard",  rule: "3 correct in a row + avg time < 12s" },
            { emoji: "🔴", label: "Demote one level",        rule: "2 consecutive incorrect answers" },
            { emoji: "⚡", label: "Speed bonus +5 XP",       rule: "Answer correct in under 5 seconds" },
            { emoji: "🔥", label: "Hard multiplier ×2 XP",  rule: "All correct hard answers" },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-12"
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span style={{ fontSize: 18 }}>{r.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                <div className="text-dim" style={{ fontSize: 12 }}>{r.rule}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
