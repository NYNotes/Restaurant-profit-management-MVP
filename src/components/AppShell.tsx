"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESKTOP_NAV, MOBILE_NAV, MOBILE_MORE_NAV } from "./nav-config";

export function AppShell({
  restaurantId,
  restaurantName,
  restaurantLabel,
  userName,
  navLabels,
  moreLabel,
  switchRestaurantLabel,
  children,
}: {
  restaurantId: string;
  restaurantName: string;
  restaurantLabel: string;
  userName: string;
  navLabels: Record<string, string>;
  moreLabel: string;
  switchRestaurantLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <Link href="/restaurants" className="block rounded-lg px-2 py-1 transition hover:bg-slate-100" title={switchRestaurantLabel}>
          <p className="text-sm font-medium text-slate-400">{restaurantLabel}</p>
          <p className="truncate text-lg font-semibold text-slate-900">{restaurantName}</p>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {DESKTOP_NAV.map((item) => {
            const href = item.href(restaurantId);
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={item.key}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {navLabels[item.labelKey]}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-2 pt-4 text-sm text-slate-500">{userName}</div>
      </aside>

      <div className="flex-1">
        <header
          className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <Link href="/restaurants" className="truncate text-base font-semibold text-slate-900">
            {restaurantName}
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label={moreLabel}
            className="-mr-2 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {moreOpen && (
          <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMoreOpen(false)}>
            <div className="absolute inset-0 bg-black/20" />
            <nav
              className="absolute right-3 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              style={{ top: "calc(env(safe-area-inset-top) + 3.5rem)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {MOBILE_MORE_NAV.map((item) => {
                const href = item.href(restaurantId);
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={item.key}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                      active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {navLabels[item.labelKey]}
                  </Link>
                );
              })}
              <Link
                href="/restaurants"
                onClick={() => setMoreOpen(false)}
                className="mt-1 block rounded-lg border-t border-slate-100 px-3 py-2 pt-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {switchRestaurantLabel}
              </Link>
            </nav>
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {MOBILE_NAV.map((item) => {
          const href = item.href(restaurantId);
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={item.key}
              href={href}
              className={`flex-1 py-2.5 text-center text-xs font-medium ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {navLabels[item.labelKey]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
