import { describe, it, expect } from "vitest";
import { calculateProfitAndLoss } from "./profitAndLoss";
import { bpToPercentString } from "./money";

describe("calculateProfitAndLoss — Jukai NY demo month from the brief", () => {
  const result = calculateProfitAndLoss({
    revenueCents: 8452000,
    foodCostCents: 2468000,
    laborCostCents: 2662400,
    rentCents: 950000,
    utilitiesCents: 214000,
    creditCardFeesCents: 231000,
    deliveryFeesCents: 0,
    insuranceCents: 0,
    marketingCents: 0,
    repairsCents: 0,
    otherExpensesCents: 742600,
  });

  it("food cost % rounds to 29.2%", () => {
    expect(bpToPercentString(result.foodCost.percentOfSalesBp, 1)).toBe("29.2");
  });

  it("labor % rounds to 31.5%", () => {
    expect(bpToPercentString(result.laborCost.percentOfSalesBp, 1)).toBe("31.5");
  });

  it("prime cost rounds to 60.7%", () => {
    expect(bpToPercentString(result.primeCost.percentOfSalesBp, 1)).toBe("60.7");
  });

  it("net profit is $11,840 at a 14.0% margin", () => {
    expect(result.netProfit.amountCents).toBe(1184000);
    expect(bpToPercentString(result.netProfit.percentOfSalesBp, 1)).toBe("14.0");
  });
});
