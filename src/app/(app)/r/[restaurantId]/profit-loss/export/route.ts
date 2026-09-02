import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { calculateProfitAndLoss, type ProfitAndLossResult } from "@/lib/calculations/profitAndLoss";
import { getFinancialMonthPLInput } from "@/lib/expenses";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { bpToPercentString } from "@/lib/calculations/money";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  await requireRestaurantAccess(restaurantId);

  const sp = Object.fromEntries(request.nextUrl.searchParams);
  const current = currentYearMonth();
  const { year, month } = parseYearMonthParam(sp, current);

  const [restaurant, thisMonth] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } }),
  ]);

  const language = restaurant.settings?.language ?? "en";
  const t = await getTranslations({ locale: language, namespace: "profitLoss" });

  const input = await getFinancialMonthPLInput(thisMonth ?? { id: "", revenueCents: 0, foodCostCents: 0 });
  const pl = calculateProfitAndLoss(input);

  const lines: { label: string; key: keyof ProfitAndLossResult }[] = [
    { label: t("lineRevenue"), key: "revenue" },
    { label: t("lineFoodCost"), key: "foodCost" },
    { label: t("lineLaborCost"), key: "laborCost" },
    { label: t("lineGrossProfit"), key: "grossProfit" },
    { label: t("linePrimeCost"), key: "primeCost" },
    { label: t("lineOperatingExpenses"), key: "operatingExpenses" },
    { label: t("lineOperatingProfit"), key: "operatingProfit" },
    { label: t("lineNetProfit"), key: "netProfit" },
  ];

  const rows: (string | number)[][] = [
    [t("colLine"), t("colAmount"), t("colPercentOfSales")],
    ...lines.map((row) => {
      const line = pl[row.key];
      return [row.label, (line.amountCents / 100).toFixed(2), bpToPercentString(line.percentOfSalesBp, 1)];
    }),
  ];

  const csv = "﻿" + toCsv(rows); // BOM so Excel picks up UTF-8 (Japanese labels) correctly
  const filename = `profit-loss-${year}-${String(month).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
