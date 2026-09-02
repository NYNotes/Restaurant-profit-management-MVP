import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { getReportsData } from "@/lib/reportsData";
import { currentYearMonth, parseYearMonthParam } from "@/lib/financialMonth";
import { bpToPercentString } from "@/lib/calculations/money";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  await requireRestaurantAccess(restaurantId);

  const sp = Object.fromEntries(request.nextUrl.searchParams);
  const current = currentYearMonth();
  const { year, month } = parseYearMonthParam(sp, current);

  const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } });
  const language = restaurant.settings?.language ?? "en";
  const t = await getTranslations({ locale: language, namespace: "reports" });

  const { pl, topProfitItems, highestFoodCostItems, priceJumps, topVendors } = await getReportsData(restaurantId, year, month);

  const rows: (string | number)[][] = [];

  rows.push([t("title")]);
  rows.push([t("revenue"), (pl.revenue.amountCents / 100).toFixed(2)]);
  rows.push([t("foodCost"), (pl.foodCost.amountCents / 100).toFixed(2)]);
  rows.push([t("laborCost"), (pl.laborCost.amountCents / 100).toFixed(2)]);
  rows.push([t("primeCost"), (pl.primeCost.amountCents / 100).toFixed(2)]);
  rows.push([t("operatingExpenses"), (pl.operatingExpenses.amountCents / 100).toFixed(2)]);
  rows.push([t("netProfit"), (pl.netProfit.amountCents / 100).toFixed(2)]);

  rows.push([]);
  rows.push([t("highestProfitItems")]);
  for (const item of topProfitItems) rows.push([item.name, (item.valueCents / 100).toFixed(2)]);

  rows.push([]);
  rows.push([t("highestFoodCostItems")]);
  for (const item of highestFoodCostItems) rows.push([item.name, bpToPercentString(item.percentBp ?? 0, 1)]);

  rows.push([]);
  rows.push([t("largestPriceIncreases")]);
  for (const jump of priceJumps) rows.push([jump.name, bpToPercentString(jump.changeBp, 1)]);

  rows.push([]);
  rows.push([t("topVendorsBySpend")]);
  for (const vendor of topVendors) rows.push([vendor.name, (vendor.totalCents / 100).toFixed(2)]);

  const csv = "﻿" + toCsv(rows); // BOM so Excel picks up UTF-8 correctly
  const filename = `reports-${year}-${String(month).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
