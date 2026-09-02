import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { aggregateExpensesByCategory, EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenses";
import { ExpenseLineItemForm } from "@/components/ExpenseLineItemForm";
import { addExpenseLineItemAction, removeExpenseLineItemAction } from "./actions";

export default async function ExpensesPage({
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

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const [t, tPL, tc, tExpCat] = await Promise.all([
    getTranslations({ locale: language, namespace: "expenses" }),
    getTranslations({ locale: language, namespace: "profitLoss" }),
    getTranslations({ locale: language, namespace: "common" }),
    getTranslations({ locale: language, namespace: "expenseCategory" }),
  ]);

  const [lineItems, categoryTotals] = await Promise.all([
    thisMonth
      ? db.expenseLineItem.findMany({
          where: { financialMonthId: thisMonth.id },
          include: { vendor: { select: { name: true } } },
          orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    thisMonth ? aggregateExpensesByCategory(thisMonth.id) : Promise.resolve(null),
  ]);

  const boundAddExpense = addExpenseLineItemAction.bind(null, restaurantId);

  const monthOptions = new Map<string, { year: number; month: number }>();
  monthOptions.set(`${year}-${month}`, { year, month });
  monthOptions.set(`${current.year}-${current.month}`, current);
  for (const m of allMonths) monthOptions.set(`${m.year}-${m.month}`, m);
  const sortedOptions = Array.from(monthOptions.values()).sort((a, b) => b.year - a.year || b.month - a.month);

  const monthLabel = (y: number, m: number) => new Intl.DateTimeFormat(language, { month: "short" }).format(new Date(y, m - 1, 1));

  const nonZeroTotals = categoryTotals ? EXPENSE_CATEGORIES.filter((c) => categoryTotals[c] > 0) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <div className="flex gap-2">
          {sortedOptions.map((opt) => {
            const active = opt.year === year && opt.month === month;
            return (
              <Link
                key={`${opt.year}-${opt.month}`}
                href={`/r/${restaurantId}/expenses?year=${opt.year}&month=${opt.month}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                }`}
              >
                {monthLabel(opt.year, opt.month)} {opt.year}
              </Link>
            );
          })}
        </div>
      </div>

      {nonZeroTotals.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {nonZeroTotals.map((cat) => (
            <div key={cat} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{tExpCat(cat)}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(categoryTotals![cat], currencyCode, language)}</p>
            </div>
          ))}
        </div>
      )}

      {lineItems.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">{tPL("colCategory")}</th>
                <th className="px-6 py-3">{tPL("colVendor")}</th>
                <th className="px-6 py-3">{tPL("colDescription")}</th>
                <th className="px-6 py-3">{tPL("colAmount2")}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item) => {
                const removeAction = removeExpenseLineItemAction.bind(null, restaurantId, item.id, year, month);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-3 text-slate-600">{tExpCat(item.category as ExpenseCategory)}</td>
                    <td className="px-6 py-3 text-slate-900">{item.vendor?.name ?? "—"}</td>
                    <td className="px-6 py-3 text-slate-500">{item.description ?? "—"}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatMoney(item.amountCents, currencyCode, language)}</td>
                    <td className="px-6 py-3 text-right">
                      <form action={removeAction}>
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          {tc("remove")}
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

      {lineItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t("emptyTitle")}</p>
        </div>
      )}

      <ExpenseLineItemForm action={boundAddExpense} year={year} month={month} vendorNames={vendors.map((v) => v.name)} />
    </div>
  );
}
