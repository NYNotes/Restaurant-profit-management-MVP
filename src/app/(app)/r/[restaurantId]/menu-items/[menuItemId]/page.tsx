import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { bpToPercentString } from "@/lib/calculations/money";
import { currentYearMonth } from "@/lib/financialMonth";
import { computeRecipeCost } from "@/lib/recipeCosting";
import {
  foodCostPercentBp,
  grossProfitCents,
  grossMarginBp,
  recommendedSellingPriceCents,
  foodCostStatus,
  monthlyRevenueCents,
  monthlyIngredientCostCents,
  monthlyContributionProfitCents,
} from "@/lib/calculations/menuItem";
import { FoodCostStatusBadge } from "@/components/FoodCostStatusBadge";
import { UnitsSoldForm } from "@/components/UnitsSoldForm";
import { deleteMenuItemAction, recordUnitsSoldAction } from "../actions";

export default async function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ restaurantId: string; menuItemId: string }>;
}) {
  const { restaurantId, menuItemId } = await params;

  const [restaurant, menuItem] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.menuItem.findFirst({ where: { id: menuItemId, restaurantId }, include: { category: true, recipe: true } }),
  ]);
  if (!menuItem) notFound();

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const settings = restaurant.settings;
  const [t, tc, tStatus] = await Promise.all([
    getTranslations({ locale: language, namespace: "menuItems" }),
    getTranslations({ locale: language, namespace: "common" }),
    getTranslations({ locale: language, namespace: "foodCostStatus" }),
  ]);

  const foodCostCents = menuItem.recipeId ? (await computeRecipeCost(menuItem.recipeId)).costPerPortionCents : 0;
  const hasRecipe = Boolean(menuItem.recipeId);

  const fcBp = foodCostPercentBp(foodCostCents, menuItem.sellingPriceCents);
  const status = hasRecipe
    ? foodCostStatus({
        foodCostPercentBp: fcBp,
        targetFoodCostBp: settings?.targetFoodCostBp ?? 3000,
        warningThresholdBp: settings?.foodCostWarningBp ?? 300,
        highThresholdBp: settings?.foodCostHighBp ?? 700,
      })
    : null;

  const { year, month } = currentYearMonth();
  const financialMonth = await db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } });
  const monthlyStat = financialMonth
    ? await db.menuItemMonthlyStat.findUnique({
        where: { menuItemId_financialMonthId: { menuItemId, financialMonthId: financialMonth.id } },
      })
    : null;

  const deleteWithIds = deleteMenuItemAction.bind(null, restaurantId, menuItemId);
  const recordUnitsSoldWithIds = recordUnitsSoldAction.bind(null, restaurantId, menuItemId);

  const monthLabel = new Intl.DateTimeFormat(language, { month: "long" }).format(new Date(year, month - 1, 1));

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            <Link href={`/r/${restaurantId}/menu-items`} className="hover:underline">
              {t("title")}
            </Link>{" "}
            / {menuItem.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{menuItem.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {menuItem.category?.name ?? tc("uncategorized")}
            {menuItem.recipe ? (
              <>
                {" "}
                ·{" "}
                <Link href={`/r/${restaurantId}/recipes/${menuItem.recipe.id}`} className="hover:underline">
                  {menuItem.recipe.name}
                </Link>
              </>
            ) : (
              ` · ${t("noRecipeAssigned")}`
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {hasRecipe && (
            <Link
              href={`/r/${restaurantId}/menu-items/${menuItemId}/what-if`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {t("whatIfSimulator")}
            </Link>
          )}
          <Link
            href={`/r/${restaurantId}/menu-items/${menuItemId}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {tc("edit")}
          </Link>
          <form action={deleteWithIds}>
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              {tc("delete")}
            </button>
          </form>
        </div>
      </div>

      {!hasRecipe ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t("noRecipeCallout")}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t("sellingPrice")}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(menuItem.sellingPriceCents, currencyCode, language)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t("foodCost")}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(foodCostCents, currencyCode, language)}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-slate-500">{bpToPercentString(fcBp, 1)}%</span>
                {status && <FoodCostStatusBadge status={status} label={tStatus(status.toLowerCase())} />}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t("profitPerPlate")}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMoney(grossProfitCents(menuItem.sellingPriceCents, foodCostCents), currencyCode, language)}
              </p>
              <p className="text-sm text-slate-500">
                {t("marginSuffix", { percent: bpToPercentString(grossMarginBp(menuItem.sellingPriceCents, foodCostCents), 1) })}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t("recommendedPrice")}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMoney(recommendedSellingPriceCents(foodCostCents, settings?.targetFoodCostBp ?? 3000), currencyCode, language)}
              </p>
              <p className="text-sm text-slate-500">{t("atTargetSuffix", { percent: bpToPercentString(settings?.targetFoodCostBp ?? 3000, 0) })}</p>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">{t("monthlySalesPerformance")}</h2>
          <UnitsSoldForm
            action={recordUnitsSoldWithIds}
            currentUnitsSold={monthlyStat?.unitsSold ?? null}
            monthLabel={t("unitsSoldLabel", { month: `${monthLabel} ${year}` })}
          />

          {monthlyStat && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{t("monthlyRevenue")}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatMoney(monthlyRevenueCents(monthlyStat.unitsSold, monthlyStat.sellingPriceCentsSnap), currencyCode, language)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{t("monthlyIngredientCost")}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatMoney(monthlyIngredientCostCents(monthlyStat.unitsSold, monthlyStat.foodCostCentsSnap), currencyCode, language)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{t("contributionProfit")}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatMoney(
                    monthlyContributionProfitCents(monthlyStat.unitsSold, monthlyStat.sellingPriceCentsSnap, monthlyStat.foodCostCentsSnap),
                    currencyCode,
                    language,
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
