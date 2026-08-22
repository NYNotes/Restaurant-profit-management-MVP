import Link from "next/link";
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

  const costs = await Promise.all(recipes.map((r) => computeRecipeCost(r.id)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Recipes</h1>
        <Link
          href={`/r/${restaurantId}/recipes/new`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Add recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No recipes yet. Add ingredients first, then build a recipe from them.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Yield</th>
                <th className="px-6 py-3">Total cost</th>
                <th className="px-6 py-3">Cost / portion</th>
                <th className="px-6 py-3">Type</th>
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
                  <td className="px-6 py-3 text-slate-500">{recipe.isSubRecipe ? "Sub-recipe" : "Recipe"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
