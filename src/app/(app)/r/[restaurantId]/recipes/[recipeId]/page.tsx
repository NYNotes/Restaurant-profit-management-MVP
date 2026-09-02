import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { UNIT_LABEL } from "@/lib/units-display";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { RecipeComponentForm } from "@/components/RecipeComponentForm";
import { deleteRecipeAction, addComponentAction, removeComponentAction } from "../actions";
import { DeleteButton } from "@/components/DeleteButton";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ restaurantId: string; recipeId: string }>;
}) {
  const { restaurantId, recipeId } = await params;

  const [restaurant, recipe] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.recipe.findFirst({ where: { id: recipeId, restaurantId }, include: { category: true } }),
  ]);
  if (!recipe) notFound();

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const [t, tc] = await Promise.all([
    getTranslations({ locale: language, namespace: "recipes" }),
    getTranslations({ locale: language, namespace: "common" }),
  ]);

  const [cost, ingredients, subRecipes] = await Promise.all([
    computeRecipeCost(recipeId),
    db.ingredient.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, purchaseUnit: true },
    }),
    db.recipe.findMany({
      where: { restaurantId, isSubRecipe: true, id: { not: recipeId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, yieldUnit: true },
    }),
  ]);

  const deleteWithIds = deleteRecipeAction.bind(null, restaurantId, recipeId);
  const addComponentWithIds = addComponentAction.bind(null, restaurantId, recipeId);
  const unitLabel = UNIT_LABEL[recipe.yieldUnit];

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            <Link href={`/r/${restaurantId}/recipes`} className="hover:underline">
              {t("title")}
            </Link>{" "}
            / {recipe.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{recipe.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {recipe.category?.name ?? tc("uncategorized")}
            {recipe.isSubRecipe ? ` · ${t("usableAsSubRecipe")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/r/${restaurantId}/recipes/${recipeId}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {tc("edit")}
          </Link>
          <DeleteButton action={deleteWithIds} label={tc("delete")} pendingLabel={tc("deleting")} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t("totalYield")}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {recipe.yieldQty} {unitLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t("totalCost")}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(cost.totalCostCents, currencyCode, language)}</p>
          <p className="text-sm text-slate-500">
            {formatMoney(cost.costPerYieldUnitCents, currencyCode, language)}/{unitLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t("costPerPortion")}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {recipe.portionCount || recipe.portionSize ? formatMoney(cost.costPerPortionCents, currencyCode, language) : "—"}
          </p>
          {recipe.portionCount && <p className="text-sm text-slate-500">{t("portionsSuffix", { count: recipe.portionCount })}</p>}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">{t("componentsTitle")}</h2>
      {cost.components.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t("componentsEmpty")}</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">{t("colComponent")}</th>
                <th className="px-6 py-3">{tc("quantity")}</th>
                <th className="px-6 py-3">{t("colCost")}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cost.components.map((c) => {
                const removeAction = removeComponentAction.bind(null, restaurantId, recipeId, c.id);
                return (
                  <tr key={c.id}>
                    <td className="px-6 py-3 text-slate-900">
                      {c.label}
                      {c.kind === "subRecipe" && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{t("subRecipeBadge")}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {c.quantity} {UNIT_LABEL[c.unit]}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatMoney(c.costCents, currencyCode, language)}</td>
                    <td className="px-6 py-3 text-right">
                      <form action={removeAction}>
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          {tc("remove")}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RecipeComponentForm
        action={addComponentWithIds}
        options={{
          ingredients: ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.purchaseUnit })),
          subRecipes: subRecipes.map((r) => ({ id: r.id, name: r.name, unit: r.yieldUnit })),
        }}
      />
    </div>
  );
}
