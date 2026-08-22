import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { bpToPercentString } from "@/lib/calculations/money";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { getReportsData } from "@/lib/reportsData";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const { pl, topProfitItems, highestFoodCostItems, priceJumps, topVendors } = data;

  const monthOptions = new Map<string, { year: number; month: number }>();
  monthOptions.set(`${current.year}-${current.month}`, current);
  for (const m of allMonths) monthOptions.set(`${m.year}-${m.month}`, m);
  const sortedOptions = Array.from(monthOptions.values()).sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <div className="flex gap-2">
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
                {MONTH_NAMES[opt.month - 1].slice(0, 3)} {opt.year}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Revenue", line: pl.revenue },
          { label: "Food Cost", line: pl.foodCost },
          { label: "Labor Cost", line: pl.laborCost },
          { label: "Prime Cost", line: pl.primeCost },
          { label: "Operating Expenses", line: pl.operatingExpenses },
          { label: "Net Profit", line: pl.netProfit },
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
          <h2 className="text-lg font-semibold text-slate-900">Highest-Profit Items</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topProfitItems.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">No monthly sales recorded yet.</p>
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
          <h2 className="text-lg font-semibold text-slate-900">Highest-Food-Cost Items</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {highestFoodCostItems.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">No menu items with recipes yet.</p>
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
          <h2 className="text-lg font-semibold text-slate-900">Largest Ingredient Price Increases</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {priceJumps.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">No recent price increases.</p>
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
          <h2 className="text-lg font-semibold text-slate-900">Top Vendors by Spend</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topVendors.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">No vendor-tagged expenses yet.</p>
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
