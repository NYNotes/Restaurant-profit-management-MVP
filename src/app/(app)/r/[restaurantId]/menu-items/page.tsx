import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { foodCostPercentBp, foodCostStatus, grossProfitCents } from "@/lib/calculations/menuItem";
import { bpToPercentString } from "@/lib/calculations/money";
import { FoodCostStatusBadge } from "@/components/FoodCostStatusBadge";

export default async function MenuItemsPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  const [restaurant, menuItems] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.menuItem.findMany({ where: { restaurantId }, include: { category: true, recipe: true }, orderBy: { name: "asc" } }),
  ]);

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const settings = restaurant.settings;

  const foodCosts = await Promise.all(
    menuItems.map((item) => (item.recipeId ? computeRecipeCost(item.recipeId).then((c) => c.costPerPortionCents) : Promise.resolve(0))),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Menu Items</h1>
        <Link
          href={`/r/${restaurantId}/menu-items/new`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Add menu item
        </Link>
      </div>

      {menuItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No menu items yet. Build a recipe first, then add it here with a selling price.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Food cost</th>
                <th className="px-6 py-3">Food cost %</th>
                <th className="px-6 py-3">Profit / plate</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menuItems.map((item, i) => {
                const foodCostCents = foodCosts[i];
                const hasRecipe = Boolean(item.recipeId);
                const fcBp = foodCostPercentBp(foodCostCents, item.sellingPriceCents);
                const status = hasRecipe
                  ? foodCostStatus({
                      foodCostPercentBp: fcBp,
                      targetFoodCostBp: settings?.targetFoodCostBp ?? 3000,
                      warningThresholdBp: settings?.foodCostWarningBp ?? 300,
                      highThresholdBp: settings?.foodCostHighBp ?? 700,
                    })
                  : null;
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link href={`/r/${restaurantId}/menu-items/${item.id}`} className="font-medium text-slate-900 hover:underline">
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-400">{item.category?.name ?? "Uncategorized"}</p>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatMoney(item.sellingPriceCents, currencyCode, language)}</td>
                    <td className="px-6 py-3 text-slate-600">{hasRecipe ? formatMoney(foodCostCents, currencyCode, language) : "—"}</td>
                    <td className="px-6 py-3 text-slate-600">{hasRecipe ? `${bpToPercentString(fcBp, 1)}%` : "—"}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {hasRecipe ? formatMoney(grossProfitCents(item.sellingPriceCents, foodCostCents), currencyCode, language) : "—"}
                    </td>
                    <td className="px-6 py-3">{status ? <FoodCostStatusBadge status={status} /> : <span className="text-slate-400">No recipe</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
