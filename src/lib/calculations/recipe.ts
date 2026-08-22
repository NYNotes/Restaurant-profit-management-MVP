import { convertUnits } from "./units";

export type ComponentCostInput =
  | {
      kind: "ingredient";
      quantity: number;
      unit: string;
      ingredientCostPerUsableUnitCents: number;
      ingredientPurchaseUnit: string;
    }
  | {
      kind: "subRecipe";
      quantity: number;
      unit: string;
      subRecipeCostPerYieldUnitCents: number;
      subRecipeYieldUnit: string;
    };

/** Total cost of one recipe component, converting its recorded quantity/unit into the cost basis's unit. */
export function componentCostCents(component: ComponentCostInput): number {
  if (component.kind === "ingredient") {
    const qtyInCostUnit = convertUnits(component.quantity, component.unit, component.ingredientPurchaseUnit);
    return Math.round(qtyInCostUnit * component.ingredientCostPerUsableUnitCents);
  }
  const qtyInCostUnit = convertUnits(component.quantity, component.unit, component.subRecipeYieldUnit);
  return Math.round(qtyInCostUnit * component.subRecipeCostPerYieldUnitCents);
}

/** Sum of all component costs = total recipe cost. */
export function recipeTotalCostCents(components: ComponentCostInput[]): number {
  return components.reduce((sum, c) => sum + componentCostCents(c), 0);
}

/** Cost per single yield unit (e.g. cost per gram), used when this recipe is a sub-recipe elsewhere. */
export function costPerYieldUnitCents(totalCostCents: number, yieldQty: number): number {
  if (yieldQty <= 0) return 0;
  return totalCostCents / yieldQty;
}

/** Cost per portion, when the recipe defines a portion size or portion count. */
export function costPerPortionCents(params: {
  totalCostCents: number;
  yieldQty: number;
  portionSize?: number | null;
  portionCount?: number | null;
}): number {
  const { totalCostCents, yieldQty, portionSize, portionCount } = params;
  if (portionCount && portionCount > 0) {
    return Math.round(totalCostCents / portionCount);
  }
  if (portionSize && portionSize > 0 && yieldQty > 0) {
    return Math.round((totalCostCents / yieldQty) * portionSize);
  }
  return Math.round(totalCostCents);
}

/**
 * Detects circular sub-recipe nesting before a recipe graph is saved.
 * `getComponents(recipeId)` should return the (ingredientId | subRecipeId) pairs currently
 * proposed for that recipe (including the in-progress edit for `rootRecipeId`).
 */
export function hasCircularDependency(
  rootRecipeId: string,
  getSubRecipeComponentIds: (recipeId: string) => string[],
): boolean {
  const visiting = new Set<string>();

  function dfs(recipeId: string): boolean {
    if (recipeId === rootRecipeId && visiting.size > 0) return true;
    if (visiting.has(recipeId)) return true;
    visiting.add(recipeId);
    for (const childId of getSubRecipeComponentIds(recipeId)) {
      if (dfs(childId)) return true;
    }
    visiting.delete(recipeId);
    return false;
  }

  for (const childId of getSubRecipeComponentIds(rootRecipeId)) {
    if (childId === rootRecipeId) return true;
    if (dfs(childId)) return true;
  }
  return false;
}
