import { describe, it, expect } from "vitest";
import { usableCostPerUnit, usableQty } from "./ingredient";

describe("usableCostPerUnit", () => {
  it("matches the brief's salmon example: $145/10lb @ 82% yield -> $17.68/lb", () => {
    const cost = usableCostPerUnit({
      purchasePriceCents: 14500,
      purchaseQty: 10,
      yieldBp: 8200,
    });
    // Not rounded to whole cents (it's a rate, not a money total) — displays as
    // $17.68/lb once formatMoney rounds it for presentation.
    expect(cost).toBeCloseTo(1768.29, 2);
  });

  it("keeps sub-cent precision for bulk-purchased, small-unit ingredients", () => {
    // 1000g for $5.00 = $0.005/g. Rounding this to the nearest cent (as an earlier
    // version of this function did) would silently double every recipe cost that
    // uses it in gram quantities — this guards against that regression.
    const cost = usableCostPerUnit({
      purchasePriceCents: 500,
      purchaseQty: 1000,
      yieldBp: 10000,
    });
    expect(cost).toBeCloseTo(0.5, 5);
  });

  it("returns purchase cost unchanged at 100% yield", () => {
    const cost = usableCostPerUnit({
      purchasePriceCents: 10000,
      purchaseQty: 10,
      yieldBp: 10000,
    });
    expect(cost).toBe(1000);
  });

  it("returns 0 for zero purchase quantity", () => {
    expect(usableCostPerUnit({ purchasePriceCents: 1000, purchaseQty: 0, yieldBp: 8000 })).toBe(0);
  });
});

describe("usableQty", () => {
  it("derives usable quantity from purchase quantity and yield", () => {
    expect(usableQty(10, 8200)).toBeCloseTo(8.2);
  });
});
