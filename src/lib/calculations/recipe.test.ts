import { describe, it, expect } from "vitest";
import { recipeTotalCostCents, costPerYieldUnitCents, costPerPortionCents, hasCircularDependency, componentCostCents } from "./recipe";
import type { ComponentCostInput } from "./recipe";

describe("recipe costing — Spicy Mayo example from the brief", () => {
  // Mayonnaise 800g @ $0.005/g, Sriracha 150g @ $0.012/g, Sesame Oil 50g @ $0.048/g
  // -> total cost $8.20 over 1000g yield -> $0.0082/g
  const components: ComponentCostInput[] = [
    { kind: "ingredient", quantity: 800, unit: "G", ingredientCostPerUsableUnitCents: 0.5, ingredientPurchaseUnit: "G" },
    { kind: "ingredient", quantity: 150, unit: "G", ingredientCostPerUsableUnitCents: 1.2, ingredientPurchaseUnit: "G" },
    { kind: "ingredient", quantity: 50, unit: "G", ingredientCostPerUsableUnitCents: 4.8, ingredientPurchaseUnit: "G" },
  ];

  it("totals to 820 cents ($8.20)", () => {
    expect(recipeTotalCostCents(components)).toBe(820);
  });

  it("cost per yield unit is 0.82 cents/g ($0.0082/g)", () => {
    const total = recipeTotalCostCents(components);
    expect(costPerYieldUnitCents(total, 1000)).toBeCloseTo(0.82);
  });

  it("converts units when a component is recorded in a different (but compatible) unit", () => {
    const kgComponent: ComponentCostInput = {
      kind: "ingredient",
      quantity: 0.8, // 0.8 kg == 800 g
      unit: "KG",
      ingredientCostPerUsableUnitCents: 0.5,
      ingredientPurchaseUnit: "G",
    };
    expect(componentCostCents(kgComponent)).toBe(400);
  });
});

describe("costPerPortionCents", () => {
  it("divides by portion count when provided", () => {
    expect(costPerPortionCents({ totalCostCents: 1000, yieldQty: 1000, portionCount: 10 })).toBe(100);
  });

  it("scales by portion size relative to yield when no portion count given", () => {
    expect(costPerPortionCents({ totalCostCents: 1000, yieldQty: 1000, portionSize: 250 })).toBe(250);
  });
});

describe("hasCircularDependency", () => {
  it("detects a direct self-reference", () => {
    expect(hasCircularDependency("recipeA", (id) => (id === "recipeA" ? ["recipeA"] : []))).toBe(true);
  });

  it("detects an indirect cycle (A -> B -> A)", () => {
    const graph: Record<string, string[]> = { recipeA: ["recipeB"], recipeB: ["recipeA"] };
    expect(hasCircularDependency("recipeA", (id) => graph[id] ?? [])).toBe(true);
  });

  it("allows valid, non-circular sub-recipe nesting", () => {
    const graph: Record<string, string[]> = { wagyuRoll: ["spicyMayo"], spicyMayo: [] };
    expect(hasCircularDependency("wagyuRoll", (id) => graph[id] ?? [])).toBe(false);
  });
});
