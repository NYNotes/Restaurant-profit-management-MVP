import { foodCostPercentBp, monthlyContributionProfitCents } from "./menuItem";

export interface WhatIfScenarioInput {
  currentSellingPriceCents: number;
  testSellingPriceCents: number;
  foodCostCents: number; // assumed unchanged by a price-only simulation
  monthlySalesUnits: number;
}

export interface WhatIfScenarioResult {
  currentMonthlyContributionProfitCents: number;
  newMonthlyContributionProfitCents: number;
  differenceCents: number;
  currentFoodCostPercentBp: number;
  newFoodCostPercentBp: number;
}

export function simulatePriceChange(input: WhatIfScenarioInput): WhatIfScenarioResult {
  const { currentSellingPriceCents, testSellingPriceCents, foodCostCents, monthlySalesUnits } = input;

  const currentMonthlyContributionProfitCents = monthlyContributionProfitCents(
    monthlySalesUnits,
    currentSellingPriceCents,
    foodCostCents,
  );
  const newMonthlyContributionProfitCents = monthlyContributionProfitCents(
    monthlySalesUnits,
    testSellingPriceCents,
    foodCostCents,
  );

  return {
    currentMonthlyContributionProfitCents,
    newMonthlyContributionProfitCents,
    differenceCents: newMonthlyContributionProfitCents - currentMonthlyContributionProfitCents,
    currentFoodCostPercentBp: foodCostPercentBp(foodCostCents, currentSellingPriceCents),
    newFoodCostPercentBp: foodCostPercentBp(foodCostCents, testSellingPriceCents),
  };
}
