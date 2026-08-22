import { describe, it, expect } from "vitest";
import {
  foodCostPercentBp,
  grossProfitCents,
  grossMarginBp,
  recommendedSellingPriceCents,
  foodCostStatus,
  monthlyRevenueCents,
  monthlyIngredientCostCents,
  monthlyContributionProfitCents,
  classifyMenuItem,
} from "./menuItem";
import { bpToPercentString } from "./money";

describe("Wagyu Roll example from the brief ($24 price / $8.90 food cost / 30% target)", () => {
  const sellingPriceCents = 2400;
  const foodCostCents = 890;

  it("food cost % rounds to 37.1%", () => {
    expect(bpToPercentString(foodCostPercentBp(foodCostCents, sellingPriceCents), 1)).toBe("37.1");
  });

  it("profit per plate is $15.10", () => {
    expect(grossProfitCents(sellingPriceCents, foodCostCents)).toBe(1510);
  });

  it("gross margin rounds to 62.9%", () => {
    expect(bpToPercentString(grossMarginBp(sellingPriceCents, foodCostCents), 1)).toBe("62.9");
  });

  it("recommended selling price at 30% target is $29.67", () => {
    expect(recommendedSellingPriceCents(foodCostCents, 3000)).toBe(2967);
  });
});

describe("Salmon Roll monthly sales example (450 plates @ $19, $5.42 food cost)", () => {
  it("matches revenue, ingredient cost, and contribution profit from the brief", () => {
    expect(monthlyRevenueCents(450, 1900)).toBe(855000);
    expect(monthlyIngredientCostCents(450, 542)).toBe(243900);
    expect(monthlyContributionProfitCents(450, 1900, 542)).toBe(611100);
  });
});

describe("foodCostStatus", () => {
  const thresholds = { targetFoodCostBp: 3000, warningThresholdBp: 300, highThresholdBp: 700 };

  it("is GOOD at or under target", () => {
    expect(foodCostStatus({ foodCostPercentBp: 2900, ...thresholds })).toBe("GOOD");
  });

  it("is WARNING slightly above target", () => {
    expect(foodCostStatus({ foodCostPercentBp: 3400, ...thresholds })).toBe("WARNING");
  });

  it("is HIGH significantly above target", () => {
    expect(foodCostStatus({ foodCostPercentBp: 3800, ...thresholds })).toBe("HIGH");
  });
});

describe("classifyMenuItem", () => {
  const averages = { avgUnitsSold: 300, avgContributionMarginCents: 1000 };

  it("classifies high popularity + high margin as STAR", () => {
    expect(classifyMenuItem({ unitsSold: 450, contributionMarginCents: 1500, ...averages })).toBe("STAR");
  });

  it("classifies low popularity + high margin as OPPORTUNITY", () => {
    expect(classifyMenuItem({ unitsSold: 100, contributionMarginCents: 1500, ...averages })).toBe("OPPORTUNITY");
  });

  it("classifies high popularity + low margin as PROBLEM", () => {
    expect(classifyMenuItem({ unitsSold: 450, contributionMarginCents: 500, ...averages })).toBe("PROBLEM");
  });

  it("classifies low popularity + low margin as LOW_PERFORMER", () => {
    expect(classifyMenuItem({ unitsSold: 100, contributionMarginCents: 500, ...averages })).toBe("LOW_PERFORMER");
  });
});
