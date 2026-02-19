"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/truth-hire", label: "🎯 Truth Hire MVP" },
  { href: "/agents", label: "🤖 Agents" },
  { href: "/research", label: "🔬 Research" },
  { href: "/messages", label: "💬 Messages" },
  { href: "/finances", label: "💰 Finances" },
  { href: "/stage", label: "🚀 Stage" },
  { href: "/onboarding", label: "📚 Onboarding" },
  { href: "/docs", label: "📖 How to Use HQ" },
];

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-slate-900 text-white font-medium"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export function HqShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                B
              </div>
              <div>
                <div className="text-sm font-semibold">BJS LABS</div>
                <div className="text-xs text-slate-400">HQ</div>
              </div>
            </div>

            <nav className="mt-4 flex flex-col gap-0.5">
              {nav.map((n) => (
                <NavItem
                  key={n.href}
                  href={n.href}
                  label={n.label}
                  active={pathname === n.href}
                />
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">Live · 5s refresh</span>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
