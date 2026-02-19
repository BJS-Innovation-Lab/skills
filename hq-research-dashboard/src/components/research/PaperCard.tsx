"use client";

import { useState } from "react";
import type { Paper } from "@/app/research/page";

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    arxiv: "bg-orange-50 text-orange-700 border-orange-200",
    semantic_scholar: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const labels: Record<string, string> = {
    arxiv: "arXiv",
    semantic_scholar: "Semantic Scholar",
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[source] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {labels[source] || source}
    </span>
  );
}

function RelevanceScore({ score }: { score: number }) {
  let color = "bg-slate-100 text-slate-600";
  if (score >= 9) color = "bg-emerald-100 text-emerald-700";
  else if (score >= 7) color = "bg-amber-100 text-amber-700";
  else if (score >= 5) color = "bg-slate-100 text-slate-600";
  else color = "bg-rose-50 text-rose-600";

  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${color}`}>
      {score}/10
    </span>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
      {tag}
    </span>
  );
}

export function PaperCard({ paper }: { paper: Paper }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const authors = Array.isArray(paper.authors) 
    ? paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? " et al." : "")
    : "";

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <SourceBadge source={paper.source} />
              <RelevanceScore score={paper.relevance_score} />
              <span className="text-xs text-slate-400">
                {formatDate(paper.published_date)}
              </span>
            </div>
            
            <h3 className="text-sm font-medium text-slate-900 leading-snug">
              {paper.title}
            </h3>
            
            {authors && (
              <p className="mt-1 text-xs text-slate-500 truncate">
                {authors}
              </p>
            )}

            {paper.relevance_tags && paper.relevance_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {paper.relevance_tags.slice(0, 4).map((tag, i) => (
                  <TagPill key={i} tag={tag} />
                ))}
              </div>
            )}
          </div>

          <svg
            className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-100">
          <div className="pt-4">
            {/* Abstract */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Abstract
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {paper.abstract || "No abstract available."}
              </p>
            </div>

            {/* Relevance Reasoning */}
            {paper.relevance_reasoning && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Why Relevant
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  {paper.relevance_reasoning}
                </p>
              </div>
            )}

            {/* Categories */}
            {paper.categories && paper.categories.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Categories
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {paper.categories.map((cat, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {paper.pdf_url && (
                <a
                  href={paper.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View PDF
                </a>
              )}
              <span className="text-xs text-slate-400">
                Discovered {formatDate(paper.discovered_at)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
