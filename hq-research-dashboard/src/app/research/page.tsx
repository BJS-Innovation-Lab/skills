"use client";

import { useEffect, useState, useCallback } from "react";
import { PaperCard } from "@/components/research/PaperCard";
import { FilterBar, type Filters } from "@/components/research/FilterBar";
import { StatsHeader } from "@/components/research/StatsHeader";

export interface Paper {
  id: string;
  source: string;
  source_id: string;
  title: string;
  authors: string[];
  abstract: string;
  published_date: string;
  categories: string[];
  pdf_url: string;
  relevance_score: number;
  relevance_reasoning: string;
  relevance_tags: string[];
  status: string;
  processed_at: string;
  discovered_at: string;
  discovered_by: string;
}

const DEFAULT_FILTERS: Filters = {
  source: "all",
  minRelevance: 1,
  dateRange: "all",
  search: "",
};

export default function ResearchPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const fetchPapers = useCallback(async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      
      let query = supabase
        .from("research_papers")
        .select("*")
        .order("discovered_at", { ascending: false });

      // Apply filters
      if (filters.source !== "all") {
        query = query.eq("source", filters.source);
      }
      
      if (filters.minRelevance > 1) {
        query = query.gte("relevance_score", filters.minRelevance);
      }

      if (filters.dateRange !== "all") {
        const now = new Date();
        let cutoff: Date;
        if (filters.dateRange === "7d") {
          cutoff = new Date(now.setDate(now.getDate() - 7));
        } else if (filters.dateRange === "30d") {
          cutoff = new Date(now.setDate(now.getDate() - 30));
        } else {
          cutoff = new Date(0);
        }
        query = query.gte("discovered_at", cutoff.toISOString());
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) throw new Error(fetchError.message);
      setPapers(data || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load papers");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchPapers(), 0);
    return () => clearTimeout(timeout);
  }, [fetchPapers]);

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const newToday = papers.filter(p => p.discovered_at?.startsWith(today)).length;
  const avgRelevance = papers.length > 0 
    ? Math.round(papers.reduce((sum, p) => sum + (p.relevance_score || 0), 0) / papers.length * 10) / 10
    : 0;

  if (error && papers.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Research Papers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Papers discovered by the Research Intelligence system
        </p>
      </div>

      {/* Stats */}
      <StatsHeader 
        total={papers.length}
        newToday={newToday}
        avgRelevance={avgRelevance}
        loading={loading}
      />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Papers List */}
      <div className="space-y-4">
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="animate-pulse text-slate-400">Loading papers...</div>
          </div>
        )}
        
        {!loading && papers.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            No papers found matching your filters
          </div>
        )}

        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </div>
    </div>
  );
}
