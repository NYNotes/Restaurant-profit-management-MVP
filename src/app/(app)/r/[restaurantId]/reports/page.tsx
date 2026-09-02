import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { bpToPercentString } from "@/lib/calculations/money";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { getReportsData } from "@/lib/reportsData";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantId: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { restaurantId } = await params;
  const sp = await searchParams;
  const current = currentYearMonth();
  const { year, month } = parseYearMonthParam(sp, current);

  const [restaurant, allMonths, data] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.financialMonth.findMany({ where: { restaurantId }, orderBy: [{ year: "desc" }, { month: "desc" }], select: { year: true, month: true } }),
    getReportsData(restaurantId, year, month),
  ]);

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const [t, tc] = await Promise.all([
    getTranslations({ locale: language, namespace: "reports" }),
    getTranslations({ locale: language, namespace: "common" }),
  ]);
  const { pl, topProfitItems, highestFoodCostItems, priceJumps, topVendors } = data;

  const monthOptions = new Map<string, { year: number; month: number }>();
  monthOptions.set(`${current.year}-${current.month}`, current);
  for (const m of allMonths) monthOptions.set(`${m.year}-${m.month}`, m);
  const sortedOptions = Array.from(monthOptions.values()).sort((a, b) => b.year - a.year || b.month - a.month);

  const monthLabel = (y: number, m: number) => new Intl.DateTimeFormat(language, { month: "short" }).format(new Date(y, m - 1, 1));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {sortedOptions.map((opt) => {
            const active = opt.year === year && opt.month === month;
            return (
              <Link
                key={`${opt.year}-${opt.month}`}
                href={`/r/${restaurantId}/reports?year=${opt.year}&month=${opt.month}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                }`}
              >
                {monthLabel(opt.year, opt.month)} {opt.year}
              </Link>
            );
          })}
          <a
            href={`/r/${restaurantId}/reports/export?year=${year}&month=${month}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {tc("exportCsv")}
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: t("revenue"), line: pl.revenue },
          { label: t("foodCost"), line: pl.foodCost },
          { label: t("laborCost"), line: pl.laborCost },
          { label: t("primeCost"), line: pl.primeCost },
          { label: t("operatingExpenses"), line: pl.operatingExpenses },
          { label: t("netProfit"), line: pl.netProfit },
        ].map((row) => (
          <div key={row.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{row.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(row.line.amountCents, currencyCode, language)}</p>
            <p className="text-xs text-slate-500">{bpToPercentString(row.line.percentOfSalesBp, 1)}%</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("highestProfitItems")}</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topProfitItems.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">{t("noSalesRecorded")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topProfitItems.map((item) => (
                  <li key={item.name} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="font-medium text-slate-900">{formatMoney(item.valueCents, currencyCode, language)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("highestFoodCostItems")}</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {highestFoodCostItems.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">{t("noRecipesYet")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {highestFoodCostItems.map((item) => (
                  <li key={item.name} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="font-medium text-slate-900">{bpToPercentString(item.percentBp ?? 0, 1)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("largestPriceIncreases")}</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {priceJumps.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">{t("noPriceIncreases")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {priceJumps.map((jump) => (
                  <li key={jump.name} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate-700">{jump.name}</span>
                    <span className="font-medium text-red-600">+{bpToPercentString(jump.changeBp, 1)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("topVendorsBySpend")}</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topVendors.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">{t("noVendorExpenses")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topVendors.map((v) => (
                  <li key={v.name} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate-700">{v.name}</span>
                    <span className="font-medium text-slate-900">{formatMoney(v.totalCents, currencyCode, language)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
