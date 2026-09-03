import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { bpToPercentString } from "@/lib/calculations/money";
import { calculateProfitAndLoss, percentChangeBp, type ProfitAndLossResult } from "@/lib/calculations/profitAndLoss";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { getFinancialMonthPLInput } from "@/lib/expenses";
import type { LaborRole } from "@/lib/laborRoles";
import { ProfitAndLossForm } from "@/components/ProfitAndLossForm";
import { LaborCostLineItemForm } from "@/components/LaborCostLineItemForm";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { saveCoreFinancialsAction, addLaborCostLineItemAction, removeLaborCostLineItemAction } from "./actions";

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

  const [restaurant, thisMonth, allMonths] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } }),
    db.financialMonth.findMany({ where: { restaurantId }, orderBy: [{ year: "desc" }, { month: "desc" }], select: { year: true, month: true } }),
  ]);

  const prevDate = new Date(year, month - 2, 1); // month is 1-indexed; -2 lands one month back
  const previousMonth = await db.financialMonth.findUnique({
    where: { restaurantId_year_month: { restaurantId, year: prevDate.getFullYear(), month: prevDate.getMonth() + 1 } },
  });

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const [t, tc, tRole] = await Promise.all([
    getTranslations({ locale: language, namespace: "profitLoss" }),
    getTranslations({ locale: language, namespace: "common" }),
    getTranslations({ locale: language, namespace: "laborRole" }),
  ]);

  const coreDefaults = thisMonth ?? { revenueCents: 0, foodCostCents: 0 };
  const [thisMonthPLInput, previousMonthPLInput, laborLineItems] = await Promise.all([
    getFinancialMonthPLInput(thisMonth ?? { id: "", ...coreDefaults }),
    previousMonth ? getFinancialMonthPLInput(previousMonth) : Promise.resolve(null),
    thisMonth
      ? db.laborCostLineItem.findMany({ where: { financialMonthId: thisMonth.id }, orderBy: [{ role: "asc" }, { createdAt: "desc" }] })
      : Promise.resolve([]),
  ]);
  const pl = calculateProfitAndLoss(thisMonthPLInput);
  const prevPl = previousMonthPLInput ? calculateProfitAndLoss(previousMonthPLInput) : null;

  const boundCoreAction = saveCoreFinancialsAction.bind(null, restaurantId);
  const boundAddLabor = addLaborCostLineItemAction.bind(null, restaurantId);

  const monthOptions = new Map<string, { year: number; month: number }>();
  monthOptions.set(`${year}-${month}`, { year, month });
  monthOptions.set(`${current.year}-${current.month}`, current);
  for (const m of allMonths) monthOptions.set(`${m.year}-${m.month}`, m);
  const sortedOptions = Array.from(monthOptions.values()).sort((a, b) => b.year - a.year || b.month - a.month);

  const lines: { label: string; key: keyof ProfitAndLossResult; bold?: boolean; goodDirection: "up" | "down" }[] = [
    { label: t("lineRevenue"), key: "revenue", bold: true, goodDirection: "up" },
    { label: t("lineFoodCost"), key: "foodCost", goodDirection: "down" },
    { label: t("lineLaborCost"), key: "laborCost", goodDirection: "down" },
    { label: t("lineGrossProfit"), key: "grossProfit", bold: true, goodDirection: "up" },
    { label: t("linePrimeCost"), key: "primeCost", goodDirection: "down" },
    { label: t("lineOperatingExpenses"), key: "operatingExpenses", goodDirection: "down" },
    { label: t("lineOperatingProfit"), key: "operatingProfit", bold: true, goodDirection: "up" },
    { label: t("lineNetProfit"), key: "netProfit", bold: true, goodDirection: "up" },
  ];

  const monthLabel = (y: number, m: number, format: "long" | "short") =>
    new Intl.DateTimeFormat(language, { month: format }).format(new Date(y, m - 1, 1));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <Link href={`/r/${restaurantId}/expenses?year=${year}&month=${month}`} className="text-sm text-slate-500 hover:underline">
            {t("manageExpenses")}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
                {monthLabel(opt.year, opt.month, "short")} {opt.year}
              </Link>
            );
          })}
          <ExportCsvButton
            href={`/r/${restaurantId}/profit-loss/export?year=${year}&month=${month}`}
            filename={`profit-loss-${year}-${String(month).padStart(2, "0")}.csv`}
            label={tc("exportCsv")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-3">{t("colLine")}</th>
              <th className="px-6 py-3">{t("colAmount")}</th>
              <th className="px-6 py-3">{t("colPercentOfSales")}</th>
              {prevPl && <th className="px-6 py-3">{t("colVsLastMonth")}</th>}
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
        {t("coreFinancialsTitle", { month: `${monthLabel(year, month, "long")} ${year}` })}
      </h2>
      <ProfitAndLossForm
        action={boundCoreAction}
        year={year}
        month={month}
        defaults={{
          revenue: centsToInput(coreDefaults.revenueCents),
          foodCost: centsToInput(coreDefaults.foodCostCents),
        }}
      />

      <h2 className="mt-8 text-lg font-semibold text-slate-900">{t("laborTitle")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("laborSubtitle")}</p>

      {laborLineItems.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">{t("colRole")}</th>
                <th className="px-6 py-3">{t("colEmployee")}</th>
                <th className="px-6 py-3">{tc("amount")}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laborLineItems.map((item) => {
                const removeAction = removeLaborCostLineItemAction.bind(null, restaurantId, item.id, year, month);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-3 text-slate-600">{tRole(item.role as LaborRole)}</td>
                    <td className="px-6 py-3 text-slate-500">{item.employeeName ?? "—"}</td>
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

      <LaborCostLineItemForm action={boundAddLabor} year={year} month={month} />
    </div>
  );
}
