"use client";

export interface Filters {
  source: "all" | "arxiv" | "semantic_scholar";
  minRelevance: number;
  dateRange: "all" | "7d" | "30d";
  search: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search papers..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Source Filter */}
        <div>
          <select
            value={filters.source}
            onChange={(e) => update({ source: e.target.value as Filters["source"] })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Sources</option>
            <option value="arxiv">arXiv</option>
            <option value="semantic_scholar">Semantic Scholar</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <select
            value={filters.dateRange}
            onChange={(e) => update({ dateRange: e.target.value as Filters["dateRange"] })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {/* Relevance Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Min Relevance:</span>
          <select
            value={filters.minRelevance}
            onChange={(e) => update({ minRelevance: Number(e.target.value) })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value={1}>Any</option>
            <option value={5}>5+</option>
            <option value={7}>7+</option>
            <option value={8}>8+</option>
            <option value={9}>9+</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.source !== "all" || filters.dateRange !== "all" || filters.minRelevance > 1) && (
          <button
            onClick={() => onChange({ source: "all", minRelevance: 1, dateRange: "all", search: "" })}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
