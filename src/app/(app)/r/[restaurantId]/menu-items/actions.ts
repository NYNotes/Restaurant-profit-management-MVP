"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { getOrCreateCurrentFinancialMonth } from "@/lib/financialMonth";

async function restaurantLocale(restaurantId: string): Promise<string> {
  const settings = await db.restaurantSettings.findUnique({ where: { restaurantId }, select: { language: true } });
  return settings?.language ?? "en";
}

function dollarsToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

async function findOrCreateMenuCategory(restaurantId: string, name: string | undefined) {
  if (!name) return null;
  const existing = await db.menuCategory.findFirst({ where: { restaurantId, name } });
  if (existing) return existing.id;
  const created = await db.menuCategory.create({ data: { restaurantId, name } });
  return created.id;
}

const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  categoryName: z.string().trim().optional(),
  sellingPrice: z.coerce.number().positive("Selling price must be greater than 0"),
  recipeId: z.string().optional(),
});

export interface MenuItemActionState {
  error?: string;
}

export async function createMenuItemAction(
  restaurantId: string,
  _prevState: MenuItemActionState,
  formData: FormData,
): Promise<MenuItemActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = menuItemSchema.safeParse({
    name: formData.get("name"),
    categoryName: formData.get("categoryName") || undefined,
    sellingPrice: formData.get("sellingPrice"),
    recipeId: formData.get("recipeId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, categoryName, sellingPrice, recipeId } = parsed.data;

  if (recipeId) {
    const recipe = await db.recipe.findFirst({ where: { id: recipeId, restaurantId } });
    if (!recipe) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "menuItems" });
      return { error: t("recipeNotFound") };
    }
  }

  const categoryId = await findOrCreateMenuCategory(restaurantId, categoryName);

  const menuItem = await db.menuItem.create({
    data: {
      restaurantId,
      name,
      categoryId,
      sellingPriceCents: dollarsToCents(String(sellingPrice)),
      recipeId: recipeId ?? null,
    },
  });

  redirect(`/r/${restaurantId}/menu-items/${menuItem.id}`);
}

export async function updateMenuItemAction(
  restaurantId: string,
  menuItemId: string,
  _prevState: MenuItemActionState,
  formData: FormData,
): Promise<MenuItemActionState> {
  await requireRestaurantAccess(restaurantId);

  const existing = await db.menuItem.findFirst({ where: { id: menuItemId, restaurantId } });
  if (!existing) {
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "menuItems" });
    return { error: t("notFound") };
  }

  const parsed = menuItemSchema.safeParse({
    name: formData.get("name"),
    categoryName: formData.get("categoryName") || undefined,
    sellingPrice: formData.get("sellingPrice"),
    recipeId: formData.get("recipeId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, categoryName, sellingPrice, recipeId } = parsed.data;

  if (recipeId) {
    const recipe = await db.recipe.findFirst({ where: { id: recipeId, restaurantId } });
    if (!recipe) {
      const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "menuItems" });
      return { error: t("recipeNotFound") };
    }
  }

  const categoryId = await findOrCreateMenuCategory(restaurantId, categoryName);

  await db.menuItem.update({
    where: { id: menuItemId },
    data: {
      name,
      categoryId,
      sellingPriceCents: dollarsToCents(String(sellingPrice)),
      recipeId: recipeId ?? null,
    },
  });

  redirect(`/r/${restaurantId}/menu-items/${menuItemId}`);
}

export async function deleteMenuItemAction(restaurantId: string, menuItemId: string): Promise<void> {
  await requireRestaurantAccess(restaurantId);
  const existing = await db.menuItem.findFirst({ where: { id: menuItemId, restaurantId } });
  if (!existing) redirect(`/r/${restaurantId}/menu-items`);

  await db.menuItem.delete({ where: { id: menuItemId } });
  redirect(`/r/${restaurantId}/menu-items`);
}

const unitsSoldSchema = z.object({
  unitsSold: z.coerce.number().int().min(0, "Units sold must be 0 or more"),
});

export interface UnitsSoldActionState {
  error?: string;
}

/**
 * Snapshots the menu item's current selling price and food cost onto this month's
 * stat row. Snapshotting (not a live reference) is what keeps past months' reports
 * stable if the recipe or ingredient costs change later — see section 30.
 */
export async function recordUnitsSoldAction(
  restaurantId: string,
  menuItemId: string,
  _prevState: UnitsSoldActionState,
  formData: FormData,
): Promise<UnitsSoldActionState> {
  await requireRestaurantAccess(restaurantId);

  const menuItem = await db.menuItem.findFirst({ where: { id: menuItemId, restaurantId } });
  if (!menuItem) {
    const t = await getTranslations({ locale: await restaurantLocale(restaurantId), namespace: "menuItems" });
    return { error: t("notFound") };
  }

  const parsed = unitsSoldSchema.safeParse({ unitsSold: formData.get("unitsSold") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const foodCostCents = menuItem.recipeId ? (await computeRecipeCost(menuItem.recipeId)).costPerPortionCents : 0;
  const financialMonth = await getOrCreateCurrentFinancialMonth(restaurantId);

  await db.menuItemMonthlyStat.upsert({
    where: { menuItemId_financialMonthId: { menuItemId, financialMonthId: financialMonth.id } },
    create: {
      menuItemId,
      financialMonthId: financialMonth.id,
      unitsSold: parsed.data.unitsSold,
      sellingPriceCentsSnap: menuItem.sellingPriceCents,
      foodCostCentsSnap: Math.round(foodCostCents),
    },
    update: {
      unitsSold: parsed.data.unitsSold,
      sellingPriceCentsSnap: menuItem.sellingPriceCents,
      foodCostCentsSnap: Math.round(foodCostCents),
    },
  });

  redirect(`/r/${restaurantId}/menu-items/${menuItemId}`);
}
