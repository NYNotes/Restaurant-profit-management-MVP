"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { usableCostPerUnit, usableQty } from "@/lib/calculations/ingredient";
import { unitDimension } from "@/lib/calculations/units";
import { UNIT_LABEL } from "@/lib/units-display";
import { INGREDIENT_PRESET_CATEGORIES } from "@/lib/ingredientPresets";

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

function dollarsToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  categoryName: z.string().trim().optional(),
  vendorName: z.string().trim().optional(),
  purchasePrice: z.coerce.number().positive("Purchase price must be greater than 0"),
  purchaseQty: z.coerce.number().positive("Purchase quantity must be greater than 0"),
  purchaseUnit: z.enum(UNIT_VALUES),
  yieldPercent: z.coerce.number().min(0.01).max(100),
});

export interface IngredientActionState {
  error?: string;
}

async function findOrCreateCategory(restaurantId: string, name: string | undefined) {
  if (!name) return null;
  const existing = await db.ingredientCategory.findFirst({ where: { restaurantId, name } });
  if (existing) return existing.id;
  const created = await db.ingredientCategory.create({ data: { restaurantId, name } });
  return created.id;
}

async function findOrCreateVendor(restaurantId: string, name: string | undefined) {
  if (!name) return null;
  const existing = await db.vendor.findFirst({ where: { restaurantId, name } });
  if (existing) return existing.id;
  const created = await db.vendor.create({ data: { restaurantId, name } });
  return created.id;
}

export async function createIngredientAction(
  restaurantId: string,
  _prevState: IngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    categoryName: formData.get("categoryName") || undefined,
    vendorName: formData.get("vendorName") || undefined,
    purchasePrice: formData.get("purchasePrice"),
    purchaseQty: formData.get("purchaseQty"),
    purchaseUnit: formData.get("purchaseUnit"),
    yieldPercent: formData.get("yieldPercent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, categoryName, vendorName, purchasePrice, purchaseQty, purchaseUnit, yieldPercent } = parsed.data;
  const purchasePriceCents = dollarsToCents(String(purchasePrice));
  const yieldBp = Math.round(yieldPercent * 100);

  const costPerUsableUnitCents = usableCostPerUnit({ purchasePriceCents, purchaseQty, yieldBp });

  const [categoryId, vendorId] = await Promise.all([
    findOrCreateCategory(restaurantId, categoryName),
    findOrCreateVendor(restaurantId, vendorName),
  ]);

  const ingredient = await db.ingredient.create({
    data: {
      restaurantId,
      name,
      categoryId,
      vendorId,
      purchasePriceCents,
      purchaseQty,
      purchaseUnit,
      usableQty: usableQty(purchaseQty, yieldBp),
      yieldBp,
      costPerUsableUnitCents,
      priceHistory: {
        create: { purchasePriceCents, purchaseQty, purchaseUnit, yieldBp, costPerUsableUnitCents },
      },
    },
  });

  redirect(`/r/${restaurantId}/ingredients/${ingredient.id}`);
}

export async function updateIngredientAction(
  restaurantId: string,
  ingredientId: string,
  _prevState: IngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  await requireRestaurantAccess(restaurantId);

  const existing = await db.ingredient.findFirst({ where: { id: ingredientId, restaurantId } });
  if (!existing) {
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "ingredients" });
    return { error: t("notFound") };
  }

  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    categoryName: formData.get("categoryName") || undefined,
    vendorName: formData.get("vendorName") || undefined,
    purchasePrice: formData.get("purchasePrice"),
    purchaseQty: formData.get("purchaseQty"),
    purchaseUnit: formData.get("purchaseUnit"),
    yieldPercent: formData.get("yieldPercent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, categoryName, vendorName, purchasePrice, purchaseQty, purchaseUnit, yieldPercent } = parsed.data;
  const purchasePriceCents = dollarsToCents(String(purchasePrice));
  const yieldBp = Math.round(yieldPercent * 100);
  const costPerUsableUnitCents = usableCostPerUnit({ purchasePriceCents, purchaseQty, yieldBp });

  const purchasingChanged =
    purchasePriceCents !== existing.purchasePriceCents ||
    purchaseQty !== existing.purchaseQty ||
    purchaseUnit !== existing.purchaseUnit ||
    yieldBp !== existing.yieldBp;

  // Changing to a unit in a different dimension (e.g. lb -> each) would make every
  // recipe that already uses this ingredient in a weight/volume quantity uncomputable
  // — see the matching check in recipes/actions.ts addComponentAction for why.
  if (unitDimension(purchaseUnit) !== unitDimension(existing.purchaseUnit)) {
    const usedInRecipes = await db.recipeComponent.findMany({
      where: { ingredientId },
      select: { recipe: { select: { name: true } } },
      distinct: ["recipeId"],
    });
    if (usedInRecipes.length > 0) {
      const names = usedInRecipes.map((c) => c.recipe.name).join(", ");
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "ingredients" });
      return { error: t("cantSwitchUnit", { unit: UNIT_LABEL[purchaseUnit], names }) };
    }
  }

  const [categoryId, vendorId] = await Promise.all([
    findOrCreateCategory(restaurantId, categoryName),
    findOrCreateVendor(restaurantId, vendorName),
  ]);

  await db.ingredient.update({
    where: { id: ingredientId },
    data: {
      name,
      categoryId,
      vendorId,
      purchasePriceCents,
      purchaseQty,
      purchaseUnit,
      usableQty: usableQty(purchaseQty, yieldBp),
      yieldBp,
      costPerUsableUnitCents,
      lastUpdatedAt: purchasingChanged ? new Date() : existing.lastUpdatedAt,
      // Recording a new price-history row (rather than overwriting) is what lets
      // past recipe/menu costs stay tied to the price that was actually in effect —
      // see section 30 of the brief (historical data integrity).
      priceHistory: purchasingChanged
        ? { create: { purchasePriceCents, purchaseQty, purchaseUnit, yieldBp, costPerUsableUnitCents } }
        : undefined,
    },
  });

  redirect(`/r/${restaurantId}/ingredients/${ingredientId}`);
}

export async function deleteIngredientAction(
  restaurantId: string,
  ingredientId: string,
  _prevState: IngredientActionState,
  _formData: FormData,
): Promise<IngredientActionState> {
  await requireRestaurantAccess(restaurantId);

  const existing = await db.ingredient.findFirst({ where: { id: ingredientId, restaurantId } });
  if (!existing) redirect(`/r/${restaurantId}/ingredients`);

  // Deleting an ingredient still referenced by a recipe would otherwise leave that
  // RecipeComponent row pointing at nothing — silently zeroing that recipe's cost
  // with no warning. Block it instead and tell the user which recipes to fix first.
  const usedInRecipes = await db.recipeComponent.findMany({
    where: { ingredientId },
    select: { recipe: { select: { name: true } } },
    distinct: ["recipeId"],
  });
  if (usedInRecipes.length > 0) {
    const names = usedInRecipes.map((c) => c.recipe.name).join(", ");
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "ingredients" });
    return { error: t("cantDeleteUsedIn", { names }) };
  }

  await db.ingredient.delete({ where: { id: ingredientId } });
  redirect(`/r/${restaurantId}/ingredients`);
}

const presetCategorySchema = z.enum(INGREDIENT_PRESET_CATEGORIES.map((c) => c.key) as [string, ...string[]]);

export type PresetCategoryRef = { kind: "builtin"; key: string } | { kind: "custom"; id: string };

export interface IngredientPresetResult {
  id: string;
  categoryKey: string | null;
  customCategoryId: string | null;
  name: string;
}

/** Called directly from the client (not bound to a <form>) — see IngredientPresetPicker. */
export async function addIngredientPresetAction(
  restaurantId: string,
  category: PresetCategoryRef,
  name: string,
): Promise<IngredientPresetResult | null> {
  await requireRestaurantAccess(restaurantId);

  const trimmedName = name.trim();
  if (!trimmedName) return null;

  if (category.kind === "builtin") {
    const parsedCategory = presetCategorySchema.safeParse(category.key);
    if (!parsedCategory.success) return null;
    const created = await db.ingredientPreset.create({
      data: { restaurantId, categoryKey: parsedCategory.data, name: trimmedName },
    });
    return { id: created.id, categoryKey: created.categoryKey, customCategoryId: null, name: created.name };
  }

  const customCategory = await db.ingredientPresetCategory.findFirst({ where: { id: category.id, restaurantId } });
  if (!customCategory) return null;
  const created = await db.ingredientPreset.create({
    data: { restaurantId, customCategoryId: customCategory.id, name: trimmedName },
  });
  return { id: created.id, categoryKey: null, customCategoryId: created.customCategoryId, name: created.name };
}

export async function removeIngredientPresetAction(restaurantId: string, presetId: string): Promise<void> {
  await requireRestaurantAccess(restaurantId);
  await db.ingredientPreset.deleteMany({ where: { id: presetId, restaurantId } });
}

export async function addIngredientPresetCategoryAction(
  restaurantId: string,
  name: string,
): Promise<{ id: string; name: string } | null> {
  await requireRestaurantAccess(restaurantId);
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  const created = await db.ingredientPresetCategory.create({ data: { restaurantId, name: trimmedName } });
  return { id: created.id, name: created.name };
}

export async function removeIngredientPresetCategoryAction(restaurantId: string, categoryId: string): Promise<void> {
  await requireRestaurantAccess(restaurantId);
  // onDelete: Cascade on IngredientPreset.customCategory drops its presets too.
  await db.ingredientPresetCategory.deleteMany({ where: { id: categoryId, restaurantId } });
}
