"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESKTOP_NAV, MOBILE_NAV } from "./nav-config";

export function AppShell({
  restaurantId,
  restaurantName,
  restaurantLabel,
  userName,
  navLabels,
  children,
}: {
  restaurantId: string;
  restaurantName: string;
  restaurantLabel: string;
  userName: string;
  navLabels: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="px-2">
          <p className="text-sm font-medium text-slate-400">{restaurantLabel}</p>
          <p className="truncate text-lg font-semibold text-slate-900">{restaurantName}</p>
        </div>

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
          <p className="truncate text-base font-semibold text-slate-900">{restaurantName}</p>
        </header>

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
