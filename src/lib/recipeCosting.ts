import { db } from "@/lib/db";
import { recipeTotalCostCents, costPerYieldUnitCents, costPerPortionCents, componentCostCents } from "@/lib/calculations/recipe";
import type { ComponentCostInput } from "@/lib/calculations/recipe";

export interface RecipeComponentBreakdown {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  costCents: number;
  kind: "ingredient" | "subRecipe";
}

export interface RecipeCostResult {
  totalCostCents: number;
  costPerYieldUnitCents: number;
  costPerPortionCents: number;
  components: RecipeComponentBreakdown[];
}

/**
 * Recursively resolves a recipe's total cost, including nested sub-recipes.
 * Cycles are rejected at write time (see addComponentAction), so recursion here
 * is bounded by the restaurant's actual recipe graph — `visiting` is only a
 * defensive guard against corrupted data, not the primary safety mechanism.
 */
export async function computeRecipeCost(recipeId: string, visiting: Set<string> = new Set()): Promise<RecipeCostResult> {
  if (visiting.has(recipeId)) {
    return { totalCostCents: 0, costPerYieldUnitCents: 0, costPerPortionCents: 0, components: [] };
  }
  visiting.add(recipeId);

  const recipe = await db.recipe.findUniqueOrThrow({
    where: { id: recipeId },
    include: {
      components: {
        include: { ingredient: true, componentRecipe: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const breakdown: RecipeComponentBreakdown[] = [];
  const costInputs: ComponentCostInput[] = [];

  for (const component of recipe.components) {
    if (component.ingredient) {
      const input: ComponentCostInput = {
        kind: "ingredient",
        quantity: component.quantity,
        unit: component.unit,
        ingredientCostPerUsableUnitCents: component.ingredient.costPerUsableUnitCents,
        ingredientPurchaseUnit: component.ingredient.purchaseUnit,
      };
      costInputs.push(input);
      breakdown.push({
        id: component.id,
        label: component.ingredient.name,
        quantity: component.quantity,
        unit: component.unit,
        costCents: componentCostCents(input),
        kind: "ingredient",
      });
    } else if (component.componentRecipe) {
      const subCost = await computeRecipeCost(component.componentRecipe.id, visiting);
      const input: ComponentCostInput = {
        kind: "subRecipe",
        quantity: component.quantity,
        unit: component.unit,
        subRecipeCostPerYieldUnitCents: subCost.costPerYieldUnitCents,
        subRecipeYieldUnit: component.componentRecipe.yieldUnit,
      };
      costInputs.push(input);
      breakdown.push({
        id: component.id,
        label: component.componentRecipe.name,
        quantity: component.quantity,
        unit: component.unit,
        costCents: componentCostCents(input),
        kind: "subRecipe",
      });
    }
  }

  visiting.delete(recipeId);

  const totalCostCents = recipeTotalCostCents(costInputs);

  return {
    totalCostCents,
    costPerYieldUnitCents: costPerYieldUnitCents(totalCostCents, recipe.yieldQty),
    costPerPortionCents: costPerPortionCents({
      totalCostCents,
      yieldQty: recipe.yieldQty,
      portionSize: recipe.portionSize,
      portionCount: recipe.portionCount,
    }),
    components: breakdown,
  };
}
