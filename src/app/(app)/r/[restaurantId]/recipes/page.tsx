import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { UNIT_LABEL } from "@/lib/units-display";

export default async function RecipesPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  const [restaurant, recipes] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.recipe.findMany({ where: { restaurantId }, include: { category: true }, orderBy: { name: "asc" } }),
  ]);

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const [t, tc] = await Promise.all([
    getTranslations({ locale: language, namespace: "recipes" }),
    getTranslations({ locale: language, namespace: "common" }),
  ]);

  const costs = await Promise.all(recipes.map((r) => computeRecipeCost(r.id)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <Link
          href={`/r/${restaurantId}/recipes/new`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {t("addRecipe")}
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t("emptyTitle")}</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">{t("colName")}</th>
                <th className="px-6 py-3">{tc("category")}</th>
                <th className="px-6 py-3">{t("colYield")}</th>
                <th className="px-6 py-3">{t("colTotalCost")}</th>
                <th className="px-6 py-3">{t("colCostPerPortion")}</th>
                <th className="px-6 py-3">{t("colType")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.map((recipe, i) => (
                <tr key={recipe.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/r/${restaurantId}/recipes/${recipe.id}`} className="font-medium text-slate-900 hover:underline">
                      {recipe.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{recipe.category?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {recipe.yieldQty} {UNIT_LABEL[recipe.yieldUnit]}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900">{formatMoney(costs[i].totalCostCents, currencyCode, language)}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {recipe.portionCount || recipe.portionSize ? formatMoney(costs[i].costPerPortionCents, currencyCode, language) : "—"}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{recipe.isSubRecipe ? t("typeSubRecipe") : t("typeRecipe")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
