import { db } from "@/lib/db";
import { calculateProfitAndLoss, percentChangeBp, type FinancialMonthInput } from "@/lib/calculations/profitAndLoss";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { foodCostPercentBp, monthlyContributionProfitCents } from "@/lib/calculations/menuItem";
import { getFinancialMonthPLInput } from "@/lib/expenses";

const ZERO_MONTH: FinancialMonthInput = {
  revenueCents: 0, foodCostCents: 0, laborCostCents: 0, rentCents: 0, utilitiesCents: 0,
  creditCardFeesCents: 0, deliveryFeesCents: 0, insuranceCents: 0, marketingCents: 0, repairsCents: 0, otherExpensesCents: 0,
};

export interface MenuItemRanking {
  name: string;
  valueCents: number;
  percentBp?: number;
}

export interface IngredientPriceJump {
  name: string;
  changeBp: number;
}

export interface VendorSpend {
  name: string;
  totalCents: number;
}

export async function getReportsData(restaurantId: string, year: number, month: number) {
  const financialMonth = await db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } });
  const pl = calculateProfitAndLoss(financialMonth ? await getFinancialMonthPLInput(financialMonth) : ZERO_MONTH);

  let topProfitItems: MenuItemRanking[] = [];
  if (financialMonth) {
    const stats = await db.menuItemMonthlyStat.findMany({
      where: { financialMonthId: financialMonth.id },
      include: { menuItem: true },
    });
    topProfitItems = stats
      .map((s) => ({
        name: s.menuItem.name,
        valueCents: monthlyContributionProfitCents(s.unitsSold, s.sellingPriceCentsSnap, s.foodCostCentsSnap),
      }))
      .sort((a, b) => b.valueCents - a.valueCents)
      .slice(0, 5);
  }

  const menuItems = await db.menuItem.findMany({ where: { restaurantId, recipeId: { not: null } } });
  const foodCostRankings: MenuItemRanking[] = [];
  for (const item of menuItems) {
    if (!item.recipeId) continue;
    const cost = await computeRecipeCost(item.recipeId);
    foodCostRankings.push({
      name: item.name,
      valueCents: cost.costPerPortionCents,
      percentBp: foodCostPercentBp(cost.costPerPortionCents, item.sellingPriceCents),
    });
  }
  const highestFoodCostItems = [...foodCostRankings].sort((a, b) => (b.percentBp ?? 0) - (a.percentBp ?? 0)).slice(0, 5);

  const ingredients = await db.ingredient.findMany({
    where: { restaurantId },
    include: { priceHistory: { orderBy: { effectiveDate: "desc" }, take: 2 } },
  });
  const priceJumps: IngredientPriceJump[] = ingredients
    .filter((ing) => ing.priceHistory.length >= 2)
    .map((ing) => ({
      name: ing.name,
      changeBp: percentChangeBp(ing.priceHistory[0].costPerUsableUnitCents, ing.priceHistory[1].costPerUsableUnitCents),
    }))
    .filter((jump) => jump.changeBp > 0)
    .sort((a, b) => b.changeBp - a.changeBp)
    .slice(0, 5);

  let topVendors: VendorSpend[] = [];
  if (financialMonth) {
    const grouped = await db.expenseLineItem.groupBy({
      by: ["vendorId"],
      where: { financialMonthId: financialMonth.id, vendorId: { not: null } },
      _sum: { amountCents: true },
    });
    const vendorIds = grouped.map((g) => g.vendorId).filter((id): id is string => id !== null);
    const vendors = await db.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
    const nameById = new Map(vendors.map((v) => [v.id, v.name]));

    topVendors = grouped
      .map((g) => ({ name: nameById.get(g.vendorId as string) ?? "Unknown vendor", totalCents: g._sum.amountCents ?? 0 }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 5);
  }

  return { pl, topProfitItems, highestFoodCostItems, priceJumps, topVendors };
}
