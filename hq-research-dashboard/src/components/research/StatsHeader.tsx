"use client";

interface StatsHeaderProps {
  total: number;
  newToday: number;
  avgRelevance: number;
  loading: boolean;
}

function StatCard({ 
  label, 
  value, 
  subtext,
  loading 
}: { 
  label: string; 
  value: string | number; 
  subtext?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        {loading ? (
          <div className="h-7 w-12 bg-slate-100 rounded animate-pulse" />
        ) : (
          <>
            <span className="text-2xl font-semibold text-slate-900">{value}</span>
            {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function StatsHeader({ total, newToday, avgRelevance, loading }: StatsHeaderProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard 
        label="Total Papers" 
        value={total} 
        subtext="in database"
        loading={loading}
      />
      <StatCard 
        label="New Today" 
        value={newToday} 
        subtext="discovered"
        loading={loading}
      />
      <StatCard 
        label="Avg Relevance" 
        value={avgRelevance} 
        subtext="/ 10"
        loading={loading}
      />
    </div>
  );
}
