import { centsToBp } from "./money";

export function foodCostPercentBp(foodCostCents: number, sellingPriceCents: number): number {
  return centsToBp(foodCostCents, sellingPriceCents);
}

export function grossProfitCents(sellingPriceCents: number, foodCostCents: number): number {
  return sellingPriceCents - foodCostCents;
}

export function grossMarginBp(sellingPriceCents: number, foodCostCents: number): number {
  return centsToBp(grossProfitCents(sellingPriceCents, foodCostCents), sellingPriceCents);
}

/** Recommended Selling Price = Food Cost / Target Food Cost %. Rounded to the nearest cent. */
export function recommendedSellingPriceCents(foodCostCents: number, targetFoodCostBp: number): number {
  if (targetFoodCostBp <= 0) return 0;
  return Math.round((foodCostCents * 10000) / targetFoodCostBp);
}

export type FoodCostStatus = "GOOD" | "WARNING" | "HIGH";

export function foodCostStatus(params: {
  foodCostPercentBp: number;
  targetFoodCostBp: number;
  warningThresholdBp: number;
  highThresholdBp: number;
}): FoodCostStatus {
  const { foodCostPercentBp: actualBp, targetFoodCostBp, warningThresholdBp, highThresholdBp } = params;
  const overBp = actualBp - targetFoodCostBp;
  if (overBp >= highThresholdBp) return "HIGH";
  if (overBp >= warningThresholdBp) return "WARNING";
  return "GOOD";
}

export function monthlyRevenueCents(unitsSold: number, sellingPriceCents: number): number {
  return unitsSold * sellingPriceCents;
}

export function monthlyIngredientCostCents(unitsSold: number, foodCostCents: number): number {
  return unitsSold * foodCostCents;
}

export function monthlyContributionProfitCents(unitsSold: number, sellingPriceCents: number, foodCostCents: number): number {
  return monthlyRevenueCents(unitsSold, sellingPriceCents) - monthlyIngredientCostCents(unitsSold, foodCostCents);
}

export type MenuEngineeringClass = "STAR" | "OPPORTUNITY" | "PROBLEM" | "LOW_PERFORMER";

/**
 * Classic menu engineering matrix: popularity vs. contribution margin, each measured
 * against the menu's own average. "Opportunity" = high margin/low popularity (an item
 * worth pushing); "Problem" = low margin/high popularity (an item worth re-costing or re-pricing).
 */
export function classifyMenuItem(params: {
  unitsSold: number;
  contributionMarginCents: number;
  avgUnitsSold: number;
  avgContributionMarginCents: number;
}): MenuEngineeringClass {
  const { unitsSold, contributionMarginCents, avgUnitsSold, avgContributionMarginCents } = params;
  const highPopularity = unitsSold >= avgUnitsSold;
  const highMargin = contributionMarginCents >= avgContributionMarginCents;

  if (highPopularity && highMargin) return "STAR";
  if (!highPopularity && highMargin) return "OPPORTUNITY";
  if (highPopularity && !highMargin) return "PROBLEM";
  return "LOW_PERFORMER";
}
