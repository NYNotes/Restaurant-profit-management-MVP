// One-time data migration: copies every row from the local SQLite dev.db into the
// new Postgres database (DATABASE_URL). Run once, right after `prisma migrate deploy`
// has created the empty Postgres schema. Safe to re-run only against an empty target —
// it does not skip duplicates.
//
// Usage: SQLITE_PATH=./dev.db DATABASE_URL=<postgres-url> npx tsx scripts/migrate-sqlite-to-postgres.ts

import Database from "better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Unit } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const sqlitePath = process.env.SQLITE_PATH ?? "./dev.db";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (target Postgres database)");

const sqlite = new Database(sqlitePath, { readonly: true });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const pg = new PrismaClient({ adapter });

function rows(table: string): Record<string, unknown>[] {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
}

function bool(v: unknown): boolean {
  return Boolean(v);
}

function date(v: unknown): Date {
  return new Date(v as string);
}

async function main() {
  console.log(`Reading from ${sqlitePath}, writing to Postgres...`);

  const users = rows("User");
  await pg.user.createMany({
    data: users.map((r) => ({
      id: r.id as string,
      email: r.email as string,
      passwordHash: r.passwordHash as string,
      name: r.name as string,
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    })),
  });
  console.log(`User: ${users.length}`);

  const organizations = rows("Organization");
  await pg.organization.createMany({
    data: organizations.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      createdAt: date(r.createdAt),
    })),
  });
  console.log(`Organization: ${organizations.length}`);

  const members = rows("OrganizationMember");
  await pg.organizationMember.createMany({
    data: members.map((r) => ({
      id: r.id as string,
      role: r.role as "OWNER" | "MANAGER" | "CHEF" | "ACCOUNTANT",
      createdAt: date(r.createdAt),
      userId: r.userId as string,
      organizationId: r.organizationId as string,
    })),
  });
  console.log(`OrganizationMember: ${members.length}`);

  const restaurants = rows("Restaurant");
  await pg.restaurant.createMany({
    data: restaurants.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
      organizationId: r.organizationId as string,
    })),
  });
  console.log(`Restaurant: ${restaurants.length}`);

  const settings = rows("RestaurantSettings");
  await pg.restaurantSettings.createMany({
    data: settings.map((r) => ({
      id: r.id as string,
      restaurantId: r.restaurantId as string,
      language: r.language as string,
      currencyCode: r.currencyCode as string,
      measurementSystem: r.measurementSystem as "US" | "METRIC",
      targetFoodCostBp: r.targetFoodCostBp as number,
      foodCostWarningBp: r.foodCostWarningBp as number,
      foodCostHighBp: r.foodCostHighBp as number,
      updatedAt: date(r.updatedAt),
    })),
  });
  console.log(`RestaurantSettings: ${settings.length}`);

  const vendors = rows("Vendor");
  await pg.vendor.createMany({
    data: vendors.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
    })),
  });
  console.log(`Vendor: ${vendors.length}`);

  const ingredientCategories = rows("IngredientCategory");
  await pg.ingredientCategory.createMany({
    data: ingredientCategories.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
    })),
  });
  console.log(`IngredientCategory: ${ingredientCategories.length}`);

  const presetCategories = rows("IngredientPresetCategory");
  await pg.ingredientPresetCategory.createMany({
    data: presetCategories.map((r) => ({
      id: r.id as string,
      restaurantId: r.restaurantId as string,
      name: r.name as string,
      createdAt: date(r.createdAt),
    })),
  });
  console.log(`IngredientPresetCategory: ${presetCategories.length}`);

  const presets = rows("IngredientPreset");
  await pg.ingredientPreset.createMany({
    data: presets.map((r) => ({
      id: r.id as string,
      restaurantId: r.restaurantId as string,
      categoryKey: r.categoryKey as string | null,
      customCategoryId: r.customCategoryId as string | null,
      name: r.name as string,
      createdAt: date(r.createdAt),
    })),
  });
  console.log(`IngredientPreset: ${presets.length}`);

  const ingredients = rows("Ingredient");
  await pg.ingredient.createMany({
    data: ingredients.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
      categoryId: r.categoryId as string | null,
      vendorId: r.vendorId as string | null,
      purchasePriceCents: r.purchasePriceCents as number,
      purchaseQty: r.purchaseQty as number,
      purchaseUnit: r.purchaseUnit as Unit,
      usableQty: r.usableQty as number,
      yieldBp: r.yieldBp as number,
      costPerUsableUnitCents: r.costPerUsableUnitCents as number,
      lastUpdatedAt: date(r.lastUpdatedAt),
      createdAt: date(r.createdAt),
    })),
  });
  console.log(`Ingredient: ${ingredients.length}`);

  const priceHistory = rows("IngredientPriceHistory");
  await pg.ingredientPriceHistory.createMany({
    data: priceHistory.map((r) => ({
      id: r.id as string,
      ingredientId: r.ingredientId as string,
      purchasePriceCents: r.purchasePriceCents as number,
      purchaseQty: r.purchaseQty as number,
      purchaseUnit: r.purchaseUnit as Unit,
      yieldBp: r.yieldBp as number,
      costPerUsableUnitCents: r.costPerUsableUnitCents as number,
      effectiveDate: date(r.effectiveDate),
    })),
  });
  console.log(`IngredientPriceHistory: ${priceHistory.length}`);

  const recipeCategories = rows("RecipeCategory");
  await pg.recipeCategory.createMany({
    data: recipeCategories.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
    })),
  });
  console.log(`RecipeCategory: ${recipeCategories.length}`);

  const recipes = rows("Recipe");
  await pg.recipe.createMany({
    data: recipes.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
      categoryId: r.categoryId as string | null,
      yieldQty: r.yieldQty as number,
      yieldUnit: r.yieldUnit as Unit,
      portionSize: r.portionSize as number | null,
      portionCount: r.portionCount as number | null,
      isSubRecipe: bool(r.isSubRecipe),
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    })),
  });
  console.log(`Recipe: ${recipes.length}`);

  const recipeComponents = rows("RecipeComponent");
  await pg.recipeComponent.createMany({
    data: recipeComponents.map((r) => ({
      id: r.id as string,
      recipeId: r.recipeId as string,
      ingredientId: r.ingredientId as string | null,
      componentRecipeId: r.componentRecipeId as string | null,
      quantity: r.quantity as number,
      unit: r.unit as Unit,
      sortOrder: r.sortOrder as number,
    })),
  });
  console.log(`RecipeComponent: ${recipeComponents.length}`);

  const menuCategories = rows("MenuCategory");
  await pg.menuCategory.createMany({
    data: menuCategories.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
    })),
  });
  console.log(`MenuCategory: ${menuCategories.length}`);

  const menuItems = rows("MenuItem");
  await pg.menuItem.createMany({
    data: menuItems.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      restaurantId: r.restaurantId as string,
      categoryId: r.categoryId as string | null,
      recipeId: r.recipeId as string | null,
      sellingPriceCents: r.sellingPriceCents as number,
      active: bool(r.active),
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    })),
  });
  console.log(`MenuItem: ${menuItems.length}`);

  const financialMonths = rows("FinancialMonth");
  await pg.financialMonth.createMany({
    data: financialMonths.map((r) => ({
      id: r.id as string,
      restaurantId: r.restaurantId as string,
      year: r.year as number,
      month: r.month as number,
      revenueCents: r.revenueCents as number,
      foodCostCents: r.foodCostCents as number,
      isClosed: bool(r.isClosed),
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    })),
  });
  console.log(`FinancialMonth: ${financialMonths.length}`);

  const monthlyStats = rows("MenuItemMonthlyStat");
  await pg.menuItemMonthlyStat.createMany({
    data: monthlyStats.map((r) => ({
      id: r.id as string,
      menuItemId: r.menuItemId as string,
      financialMonthId: r.financialMonthId as string,
      unitsSold: r.unitsSold as number,
      sellingPriceCentsSnap: r.sellingPriceCentsSnap as number,
      foodCostCentsSnap: r.foodCostCentsSnap as number,
    })),
  });
  console.log(`MenuItemMonthlyStat: ${monthlyStats.length}`);

  const laborCostLineItems = rows("LaborCostLineItem");
  await pg.laborCostLineItem.createMany({
    data: laborCostLineItems.map((r) => ({
      id: r.id as string,
      financialMonthId: r.financialMonthId as string,
      role: r.role as "KITCHEN" | "FRONT_OF_HOUSE" | "MANAGEMENT" | "DELIVERY" | "OTHER",
      employeeName: r.employeeName as string | null,
      amountCents: r.amountCents as number,
      createdAt: date(r.createdAt),
    })),
  });
  console.log(`LaborCostLineItem: ${laborCostLineItems.length}`);

  const expenseLineItems = rows("ExpenseLineItem");
  await pg.expenseLineItem.createMany({
    data: expenseLineItems.map((r) => ({
      id: r.id as string,
      financialMonthId: r.financialMonthId as string,
      category: r.category as
        | "RENT"
        | "UTILITIES"
        | "CREDIT_CARD_FEES"
        | "DELIVERY_FEES"
        | "INSURANCE"
        | "MARKETING"
        | "REPAIRS"
        | "OTHER",
      vendorId: r.vendorId as string | null,
      description: r.description as string | null,
      amountCents: r.amountCents as number,
      createdAt: date(r.createdAt),
    })),
  });
  console.log(`ExpenseLineItem: ${expenseLineItems.length}`);

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await pg.$disconnect();
  });
