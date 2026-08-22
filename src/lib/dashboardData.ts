import { db } from "@/lib/db";
import { currentYearMonth } from "@/lib/financialMonth";
import { calculateProfitAndLoss, percentChangeBp, type FinancialMonthInput } from "@/lib/calculations/profitAndLoss";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { foodCostPercentBp, foodCostStatus, monthlyContributionProfitCents } from "@/lib/calculations/menuItem";
import { bpToPercentString } from "@/lib/calculations/money";
import { getFinancialMonthPLInput } from "@/lib/expenses";

const ZERO_MONTH: FinancialMonthInput = {
  revenueCents: 0, foodCostCents: 0, laborCostCents: 0, rentCents: 0, utilitiesCents: 0,
  creditCardFeesCents: 0, deliveryFeesCents: 0, insuranceCents: 0, marketingCents: 0, repairsCents: 0, otherExpensesCents: 0,
};

export interface NeedsAttentionItem {
  message: string;
}

export interface TopProfitItem {
  name: string;
  unitsSold: number;
  profitCents: number;
}

export async function getDashboardData(restaurantId: string) {
  const { year, month } = currentYearMonth();
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;

  const [restaurant, thisMonth, previousMonth] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } }),
    db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year: prevYear, month: prevMonth } } }),
  ]);

  const settings = restaurant.settings;
  const [thisMonthPLInput, previousMonthPLInput] = await Promise.all([
    thisMonth ? getFinancialMonthPLInput(thisMonth) : Promise.resolve(ZERO_MONTH),
    previousMonth ? getFinancialMonthPLInput(previousMonth) : Promise.resolve(null),
  ]);
  const pl = calculateProfitAndLoss(thisMonthPLInput);
  const prevPl = previousMonthPLInput ? calculateProfitAndLoss(previousMonthPLInput) : null;

  const needsAttention: NeedsAttentionItem[] = [];

  if (prevPl) {
    const revenueChangeBp = percentChangeBp(pl.revenue.amountCents, prevPl.revenue.amountCents);
    const laborChangeBp = percentChangeBp(pl.laborCost.amountCents, prevPl.laborCost.amountCents);
    const profitChangeBp = percentChangeBp(pl.netProfit.amountCents, prevPl.netProfit.amountCents);

    if (laborChangeBp >= 200) {
      needsAttention.push({ message: `Labor cost increased ${bpToPercentString(laborChangeBp, 1)}% vs last month` });
    }
    if (profitChangeBp <= -200) {
      needsAttention.push({ message: `Net profit decreased ${bpToPercentString(Math.abs(profitChangeBp), 1)}% vs last month` });
    }
    if (revenueChangeBp <= -500) {
      needsAttention.push({ message: `Revenue decreased ${bpToPercentString(Math.abs(revenueChangeBp), 1)}% vs last month` });
    }
  }

  // Ingredient price increases (compare the two most recent price history entries)
  const ingredients = await db.ingredient.findMany({
    where: { restaurantId },
    include: { priceHistory: { orderBy: { effectiveDate: "desc" }, take: 2 } },
  });
  for (const ing of ingredients) {
    if (ing.priceHistory.length < 2) continue;
    const [latest, previous] = ing.priceHistory;
    const changeBp = percentChangeBp(latest.costPerUsableUnitCents, previous.costPerUsableUnitCents);
    if (changeBp >= 1000) {
      needsAttention.push({ message: `${ing.name} price increased ${bpToPercentString(changeBp, 1)}%` });
    }
  }

  // Menu items with a HIGH food cost status
  const menuItems = await db.menuItem.findMany({ where: { restaurantId, recipeId: { not: null } } });
  for (const item of menuItems) {
    if (!item.recipeId) continue;
    const cost = await computeRecipeCost(item.recipeId);
    const fcBp = foodCostPercentBp(cost.costPerPortionCents, item.sellingPriceCents);
    const status = foodCostStatus({
      foodCostPercentBp: fcBp,
      targetFoodCostBp: settings?.targetFoodCostBp ?? 3000,
      warningThresholdBp: settings?.foodCostWarningBp ?? 300,
      highThresholdBp: settings?.foodCostHighBp ?? 700,
    });
    if (status === "HIGH") {
      needsAttention.push({ message: `${item.name} food cost is ${bpToPercentString(fcBp, 1)}%` });
    }
  }

  // Top profit items this month
  let topProfitItems: TopProfitItem[] = [];
  if (thisMonth) {
    const stats = await db.menuItemMonthlyStat.findMany({
      where: { financialMonthId: thisMonth.id },
      include: { menuItem: true },
    });
    topProfitItems = stats
      .map((s) => ({
        name: s.menuItem.name,
        unitsSold: s.unitsSold,
        profitCents: monthlyContributionProfitCents(s.unitsSold, s.sellingPriceCentsSnap, s.foodCostCentsSnap),
      }))
      .sort((a, b) => b.profitCents - a.profitCents)
      .slice(0, 5);
  }

  return {
    restaurant,
    year,
    month,
    pl,
    prevPl,
    needsAttention,
    topProfitItems,
  };
}
