"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { hasCircularDependency } from "@/lib/calculations/recipe";
import { unitDimension } from "@/lib/calculations/units";
import { UNIT_LABEL } from "@/lib/units-display";

async function restaurantLocale(restaurantId: string): Promise<string> {
  const settings = await db.restaurantSettings.findUnique({ where: { restaurantId }, select: { language: true } });
  return settings?.language ?? "en";
}

const UNIT_VALUES = [
  "LB",
  "OZ",
  "KG",
  "G",
  "GALLON",
  "QUART",
  "PINT",
  "CUP",
  "FL_OZ",
  "L",
  "ML",
  "EACH",
  "CASE",
  "PACK",
] as const;

async function findOrCreateRecipeCategory(restaurantId: string, name: string | undefined) {
  if (!name) return null;
  const existing = await db.recipeCategory.findFirst({ where: { restaurantId, name } });
  if (existing) return existing.id;
  const created = await db.recipeCategory.create({ data: { restaurantId, name } });
  return created.id;
}

const recipeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  categoryName: z.string().trim().optional(),
  yieldQty: z.coerce.number().positive("Yield quantity must be greater than 0"),
  yieldUnit: z.enum(UNIT_VALUES),
  portionSize: z.coerce.number().positive().optional(),
  portionCount: z.coerce.number().positive().optional(),
  isSubRecipe: z.coerce.boolean().optional(),
});

export interface RecipeActionState {
  error?: string;
}

function parseOptionalNumber(formData: FormData, key: string): number | undefined {
  const raw = formData.get(key);
  if (!raw || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function createRecipeAction(
  restaurantId: string,
  _prevState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = recipeSchema.safeParse({
    name: formData.get("name"),
    categoryName: formData.get("categoryName") || undefined,
    yieldQty: formData.get("yieldQty"),
    yieldUnit: formData.get("yieldUnit"),
    portionSize: parseOptionalNumber(formData, "portionSize"),
    portionCount: parseOptionalNumber(formData, "portionCount"),
    isSubRecipe: formData.get("isSubRecipe") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, categoryName, yieldQty, yieldUnit, portionSize, portionCount, isSubRecipe } = parsed.data;
  const categoryId = await findOrCreateRecipeCategory(restaurantId, categoryName);

  const recipe = await db.recipe.create({
    data: {
      restaurantId,
      name,
      categoryId,
      yieldQty,
      yieldUnit,
      portionSize: portionSize ?? null,
      portionCount: portionCount ?? null,
      isSubRecipe: isSubRecipe ?? false,
    },
  });

  redirect(`/r/${restaurantId}/recipes/${recipe.id}`);
}

export async function updateRecipeAction(
  restaurantId: string,
  recipeId: string,
  _prevState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  await requireRestaurantAccess(restaurantId);

  const existing = await db.recipe.findFirst({ where: { id: recipeId, restaurantId } });
  if (!existing) {
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
    return { error: t("notFound") };
  }

  const parsed = recipeSchema.safeParse({
    name: formData.get("name"),
    categoryName: formData.get("categoryName") || undefined,
    yieldQty: formData.get("yieldQty"),
    yieldUnit: formData.get("yieldUnit"),
    portionSize: parseOptionalNumber(formData, "portionSize"),
    portionCount: parseOptionalNumber(formData, "portionCount"),
    isSubRecipe: formData.get("isSubRecipe") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, categoryName, yieldQty, yieldUnit, portionSize, portionCount, isSubRecipe } = parsed.data;

  // Same reasoning as the ingredient purchaseUnit guard: a recipe used as a sub-recipe
  // elsewhere has components measuring it in its current yield unit's dimension. Switching
  // dimensions (e.g. g -> each) would make those parent recipes uncomputable.
  if (unitDimension(yieldUnit) !== unitDimension(existing.yieldUnit)) {
    const usedAsSubRecipe = await db.recipeComponent.findMany({
      where: { componentRecipeId: recipeId },
      select: { recipe: { select: { name: true } } },
      distinct: ["recipeId"],
    });
    if (usedAsSubRecipe.length > 0) {
      const names = usedAsSubRecipe.map((c) => c.recipe.name).join(", ");
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return { error: t("cantSwitchUnit", { unit: UNIT_LABEL[yieldUnit], names }) };
    }
  }

  const categoryId = await findOrCreateRecipeCategory(restaurantId, categoryName);

  await db.recipe.update({
    where: { id: recipeId },
    data: {
      name,
      categoryId,
      yieldQty,
      yieldUnit,
      portionSize: portionSize ?? null,
      portionCount: portionCount ?? null,
      isSubRecipe: isSubRecipe ?? false,
    },
  });

  redirect(`/r/${restaurantId}/recipes/${recipeId}`);
}

export async function deleteRecipeAction(
  restaurantId: string,
  recipeId: string,
  _prevState: RecipeActionState,
  _formData: FormData,
): Promise<RecipeActionState> {
  await requireRestaurantAccess(restaurantId);
  const existing = await db.recipe.findFirst({ where: { id: recipeId, restaurantId } });
  if (!existing) redirect(`/r/${restaurantId}/recipes`);

  // Same reasoning as deleteIngredientAction: deleting a recipe that's still used as a
  // sub-recipe elsewhere, or assigned to a menu item, would leave a dangling reference
  // and silently zero out costs downstream. Block it and name what to fix first.
  const [usedAsSubRecipe, usedByMenuItems] = await Promise.all([
    db.recipeComponent.findMany({
      where: { componentRecipeId: recipeId },
      select: { recipe: { select: { name: true } } },
      distinct: ["recipeId"],
    }),
    db.menuItem.findMany({ where: { recipeId }, select: { name: true } }),
  ]);

  const blockers = [...usedAsSubRecipe.map((c) => c.recipe.name), ...usedByMenuItems.map((m) => m.name)];
  if (blockers.length > 0) {
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
    return { error: t("cantDeleteUsedIn", { names: blockers.join(", ") }) };
  }

  await db.recipe.delete({ where: { id: recipeId } });
  redirect(`/r/${restaurantId}/recipes`);
}

const componentSchema = z.object({
  componentRef: z.string().min(1, "Choose an ingredient or sub-recipe"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.enum(UNIT_VALUES),
});

export interface ComponentActionState {
  error?: string;
}

/** componentRef is "ingredient:<id>" or "recipe:<id>", set by the <select> in RecipeComponentForm. */
export async function addComponentAction(
  restaurantId: string,
  recipeId: string,
  _prevState: ComponentActionState,
  formData: FormData,
): Promise<ComponentActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = componentSchema.safeParse({
    componentRef: formData.get("componentRef"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { componentRef, quantity, unit } = parsed.data;
  const [type, refId] = componentRef.split(":");

  if (type === "ingredient") {
    const ingredient = await db.ingredient.findFirst({ where: { id: refId, restaurantId } });
    if (!ingredient) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return { error: t("ingredientNotFound") };
    }

    // Cost conversion between components and their target unit only works within the
    // same dimension (weight/volume/count) — see convertUnits. Reject a mismatch here,
    // at write time, instead of letting the recipe page crash the next time it's opened.
    if (unitDimension(unit) !== unitDimension(ingredient.purchaseUnit)) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return {
        error: t("incompatibleUnitIngredient", {
          unit: UNIT_LABEL[unit],
          name: ingredient.name,
          targetUnit: UNIT_LABEL[ingredient.purchaseUnit],
        }),
      };
    }

    await db.recipeComponent.create({
      data: { recipeId, ingredientId: ingredient.id, quantity, unit },
    });
  } else if (type === "recipe") {
    const subRecipe = await db.recipe.findFirst({ where: { id: refId, restaurantId } });
    if (!subRecipe) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return { error: t("subRecipeNotFound") };
    }

    if (refId === recipeId) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return { error: t("cannotContainItself") };
    }

    if (unitDimension(unit) !== unitDimension(subRecipe.yieldUnit)) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return {
        error: t("incompatibleUnitSubRecipe", {
          unit: UNIT_LABEL[unit],
          name: subRecipe.name,
          targetUnit: UNIT_LABEL[subRecipe.yieldUnit],
        }),
      };
    }

    const edges = await db.recipeComponent.findMany({
      where: { recipe: { restaurantId }, componentRecipeId: { not: null } },
      select: { recipeId: true, componentRecipeId: true },
    });
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      if (!edge.componentRecipeId) continue;
      const list = adjacency.get(edge.recipeId) ?? [];
      list.push(edge.componentRecipeId);
      adjacency.set(edge.recipeId, list);
    }
    adjacency.set(recipeId, [...(adjacency.get(recipeId) ?? []), refId]);

    if (hasCircularDependency(recipeId, (id) => adjacency.get(id) ?? [])) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
      return { error: t("circularError") };
    }

    await db.recipeComponent.create({
      data: { recipeId, componentRecipeId: subRecipe.id, quantity, unit },
    });
  } else {
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "recipes" });
    return { error: t("invalidComponent") };
  }

  redirect(`/r/${restaurantId}/recipes/${recipeId}`);
}

export async function removeComponentAction(restaurantId: string, recipeId: string, componentId: string): Promise<void> {
  await requireRestaurantAccess(restaurantId);
  const component = await db.recipeComponent.findFirst({ where: { id: componentId, recipe: { restaurantId, id: recipeId } } });
  if (component) {
    await db.recipeComponent.delete({ where: { id: componentId } });
  }
  redirect(`/r/${restaurantId}/recipes/${recipeId}`);
}
