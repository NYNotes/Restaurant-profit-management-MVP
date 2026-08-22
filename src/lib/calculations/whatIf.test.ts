import { describe, it, expect } from "vitest";
import { simulatePriceChange } from "./whatIf";
import { bpToPercentString } from "./money";

describe("simulatePriceChange — Wagyu Roll example ($24 -> $27, 420 plates/mo)", () => {
  const result = simulatePriceChange({
    currentSellingPriceCents: 2400,
    testSellingPriceCents: 2700,
    foodCostCents: 890,
    monthlySalesUnits: 420,
  });

  it("shows the expected monthly contribution profit swing of +$1,260", () => {
    expect(result.differenceCents).toBe(126000);
  });

  it("shows food cost % dropping from 37.1% to 33.0%", () => {
    expect(bpToPercentString(result.currentFoodCostPercentBp, 1)).toBe("37.1");
    expect(bpToPercentString(result.newFoodCostPercentBp, 1)).toBe("33.0");
  });
});
