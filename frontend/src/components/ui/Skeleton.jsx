// ─── components/ui/Skeleton.jsx ──────────────────────────────────────────────

/**
 * Generic skeleton placeholder.
 * Usage: <Skeleton width="100%" height={20} />
 */
export function Skeleton({ width = "100%", height = 16, borderRadius = "var(--radius-md)", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

/** Pre-built skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ gap: 10 }}>
      <Skeleton width={32} height={32} borderRadius="50%" />
      <Skeleton width="60%" height={28} />
      <Skeleton width="80%" height={14} />
    </div>
  );
}

/** Pre-built skeleton for a topic card */
export function TopicCardSkeleton() {
  return (
    <div className="topic-card" style={{ cursor: "default" }}>
      <Skeleton width={52} height={52} borderRadius="var(--radius-md)" />
      <Skeleton width="70%" height={18} />
      <Skeleton width="90%" height={14} />
    </div>
  );
}

/** Pre-built skeleton for the dashboard header */
export function DashboardSkeleton() {
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-32" style={{ flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={280} height={36} />
          <Skeleton width={200} height={16} />
        </div>
        <Skeleton width={120} height={40} borderRadius="var(--radius-full)" />
      </div>

      {/* XP card */}
      <div className="card mb-24">
        <div className="flex items-center gap-12 mb-16">
          <Skeleton width={56} height={56} borderRadius="50%" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <Skeleton width="30%" height={22} />
            <Skeleton width="20%" height={16} />
          </div>
        </div>
        <Skeleton height={8} borderRadius="var(--radius-full)" />
      </div>

      {/* Stats grid */}
      <div className="grid-4 mb-24">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Cards */}
      <div className="grid-2 mb-24">
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton width="40%" height={20} />
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={14} />)}
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton width="40%" height={20} />
          <Skeleton height={120} />
        </div>
      </div>
    </div>
  );
}
