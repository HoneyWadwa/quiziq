// ─── components/ui/XPLevelCard.jsx ───────────────────────────────────────────
import { xpForLevel, levelLabel, levelIcon } from "../../data/constants.js";
import ProgressBar from "./ProgressBar.jsx";

export default function XPLevelCard({ user }) {
  const currentLevelXP = xpForLevel(user.level);
  const nextLevelXP    = xpForLevel(user.level + 1);
  const xpInLevel      = user.xp - currentLevelXP;
  const xpNeeded       = nextLevelXP - currentLevelXP;
  const pct            = Math.max(Math.min((xpInLevel / xpNeeded) * 100, 100), 2);

  return (
    <div
      className="card card-glow mb-24"
      style={{
        background: "linear-gradient(135deg, rgba(108,59,255,0.12), rgba(0,212,255,0.06))",
      }}
    >
      <div className="flex items-center justify-between mb-16" style={{ flexWrap: "wrap", gap: 12 }}>
        {/* Left: avatar + level info */}
        <div className="flex items-center gap-12">
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--grad-violet)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "var(--shadow-violet)",
            }}
          >
            {levelIcon(user.level)}
          </div>
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>
              Level {user.level}
            </div>
            <span className="badge badge-violet">{levelLabel(user.level)}</span>
          </div>
        </div>

        {/* Right: XP count */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 20, fontWeight: 700,
              color: "var(--cyan)",
            }}
          >
            {user.xp.toLocaleString()} XP
          </div>
          <div className="text-dim text-sm">
            {(nextLevelXP - user.xp).toLocaleString()} XP to Level {user.level + 1}
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="flex items-center gap-12">
        <span className="text-dim text-sm">{currentLevelXP}</span>
        <div style={{ flex: 1 }}>
          <ProgressBar value={pct} showGlow />
        </div>
        <span className="text-dim text-sm">{nextLevelXP}</span>
      </div>
    </div>
  );
}
