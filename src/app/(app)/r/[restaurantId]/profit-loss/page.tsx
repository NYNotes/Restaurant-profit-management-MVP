import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { bpToPercentString } from "@/lib/calculations/money";
import { calculateProfitAndLoss, percentChangeBp, type ProfitAndLossResult } from "@/lib/calculations/profitAndLoss";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { getFinancialMonthPLInput, EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/lib/expenses";
import { ProfitAndLossForm } from "@/components/ProfitAndLossForm";
import { ExpenseLineItemForm } from "@/components/ExpenseLineItemForm";
import { saveCoreFinancialsAction, addExpenseLineItemAction, removeExpenseLineItemAction } from "./actions";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default async function ProfitAndLossPage({
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

  const [restaurant, thisMonth, allMonths, vendors] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } }),
    db.financialMonth.findMany({ where: { restaurantId }, orderBy: [{ year: "desc" }, { month: "desc" }], select: { year: true, month: true } }),
    db.vendor.findMany({ where: { restaurantId }, orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  const prevDate = new Date(year, month - 2, 1); // month is 1-indexed; -2 lands one month back
  const previousMonth = await db.financialMonth.findUnique({
    where: { restaurantId_year_month: { restaurantId, year: prevDate.getFullYear(), month: prevDate.getMonth() + 1 } },
  });

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";

  const coreDefaults = thisMonth ?? { revenueCents: 0, foodCostCents: 0, laborCostCents: 0 };
  const [thisMonthPLInput, previousMonthPLInput, lineItems] = await Promise.all([
    getFinancialMonthPLInput(thisMonth ?? { id: "", ...coreDefaults }),
    previousMonth ? getFinancialMonthPLInput(previousMonth) : Promise.resolve(null),
    thisMonth
      ? db.expenseLineItem.findMany({
          where: { financialMonthId: thisMonth.id },
          include: { vendor: { select: { name: true } } },
          orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
  ]);
  const pl = calculateProfitAndLoss(thisMonthPLInput);
  const prevPl = previousMonthPLInput ? calculateProfitAndLoss(previousMonthPLInput) : null;

  const boundCoreAction = saveCoreFinancialsAction.bind(null, restaurantId);
  const boundAddExpense = addExpenseLineItemAction.bind(null, restaurantId);

  const monthOptions = new Map<string, { year: number; month: number }>();
  monthOptions.set(`${year}-${month}`, { year, month });
  monthOptions.set(`${current.year}-${current.month}`, current);
  for (const m of allMonths) monthOptions.set(`${m.year}-${m.month}`, m);
  const sortedOptions = Array.from(monthOptions.values()).sort((a, b) => b.year - a.year || b.month - a.month);

  const lines: { label: string; key: keyof ProfitAndLossResult; bold?: boolean; goodDirection: "up" | "down" }[] = [
    { label: "Revenue", key: "revenue", bold: true, goodDirection: "up" },
    { label: "Food Cost", key: "foodCost", goodDirection: "down" },
    { label: "Labor Cost", key: "laborCost", goodDirection: "down" },
    { label: "Gross Profit", key: "grossProfit", bold: true, goodDirection: "up" },
    { label: "Prime Cost", key: "primeCost", goodDirection: "down" },
    { label: "Operating Expenses", key: "operatingExpenses", goodDirection: "down" },
    { label: "Operating Profit", key: "operatingProfit", bold: true, goodDirection: "up" },
    { label: "Net Profit", key: "netProfit", bold: true, goodDirection: "up" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Profit &amp; Loss</h1>
        <div className="flex gap-2">
          {sortedOptions.map((opt) => {
            const active = opt.year === year && opt.month === month;
            return (
              <Link
                key={`${opt.year}-${opt.month}`}
                href={`/r/${restaurantId}/profit-loss?year=${opt.year}&month=${opt.month}`}
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-3">Line</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">% of Sales</th>
              {prevPl && <th className="px-6 py-3">vs Last Month</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((row) => {
              const line = pl[row.key];
              const changeBp = prevPl ? percentChangeBp(line.amountCents, prevPl[row.key].amountCents) : null;
              return (
                <tr key={row.label} className={row.bold ? "bg-slate-50" : undefined}>
                  <td className={`px-6 py-3 ${row.bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>{row.label}</td>
                  <td className={`px-6 py-3 ${row.bold ? "font-semibold text-slate-900" : "text-slate-900"}`}>
                    {formatMoney(line.amountCents, currencyCode, language)}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{bpToPercentString(line.percentOfSalesBp, 1)}%</td>
                  {prevPl && changeBp !== null && (
                    <td className="px-6 py-3 text-slate-500">
                      <span
                        className={
                          changeBp === 0
                            ? ""
                            : (row.goodDirection === "up" ? changeBp > 0 : changeBp < 0)
                              ? "text-emerald-600"
                              : "text-red-600"
                        }
                      >
                        {changeBp > 0 ? "+" : ""}
                        {bpToPercentString(changeBp, 1)}%
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        Revenue, Food Cost &amp; Labor — {MONTH_NAMES[month - 1]} {year}
      </h2>
      <ProfitAndLossForm
        action={boundCoreAction}
        year={year}
        month={month}
        defaults={{
          revenue: centsToInput(coreDefaults.revenueCents),
          foodCost: centsToInput(coreDefaults.foodCostCents),
          laborCost: centsToInput(coreDefaults.laborCostCents),
        }}
      />

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Vendor Expenses</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add each bill with its vendor — the category totals above are the sum of these line items.
      </p>

      {lineItems.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item) => {
                const removeAction = removeExpenseLineItemAction.bind(null, restaurantId, item.id, year, month);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-3 text-slate-600">{EXPENSE_CATEGORY_LABEL[item.category as ExpenseCategory]}</td>
                    <td className="px-6 py-3 text-slate-900">{item.vendor?.name ?? "—"}</td>
                    <td className="px-6 py-3 text-slate-500">{item.description ?? "—"}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatMoney(item.amountCents, currencyCode, language)}</td>
                    <td className="px-6 py-3 text-right">
                      <form action={removeAction}>
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseLineItemForm action={boundAddExpense} year={year} month={month} vendorNames={vendors.map((v) => v.name)} />
    </div>
  );
}
