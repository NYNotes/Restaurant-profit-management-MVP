import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { UNIT_LABEL } from "@/lib/units-display";
import { bpToPercentString } from "@/lib/calculations/money";
import { percentChangeBp } from "@/lib/calculations/profitAndLoss";
import { deleteIngredientAction } from "../actions";
import { DeleteButton } from "@/components/DeleteButton";

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ restaurantId: string; ingredientId: string }>;
}) {
  const { restaurantId, ingredientId } = await params;

  const [restaurant, ingredient] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.ingredient.findFirst({
      where: { id: ingredientId, restaurantId },
      include: {
        category: true,
        vendor: true,
        priceHistory: { orderBy: { effectiveDate: "desc" } },
      },
    }),
  ]);

  if (!ingredient) notFound();

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const unitLabel = UNIT_LABEL[ingredient.purchaseUnit];

  const deleteWithIds = deleteIngredientAction.bind(null, restaurantId, ingredientId);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            <Link href={`/r/${restaurantId}/ingredients`} className="hover:underline">
              Ingredients
            </Link>{" "}
            / {ingredient.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{ingredient.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {ingredient.category?.name ?? "Uncategorized"}
            {ingredient.vendor ? ` · ${ingredient.vendor.name}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/r/${restaurantId}/ingredients/${ingredientId}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </Link>
          <DeleteButton action={deleteWithIds} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Purchase cost</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatMoney(ingredient.purchasePriceCents, currencyCode, language)}
          </p>
          <p className="text-sm text-slate-500">
            for {ingredient.purchaseQty} {unitLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Yield</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{bpToPercentString(ingredient.yieldBp, 0)}%</p>
          <p className="text-sm text-slate-500">
            {ingredient.usableQty.toFixed(2)} {unitLabel} usable
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Actual usable cost</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatMoney(ingredient.costPerUsableUnitCents, currencyCode, language)}/{unitLabel}
          </p>
          <p className="text-sm text-slate-500">updated {formatDate(ingredient.lastUpdatedAt, language)}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Price history</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Purchase price</th>
              <th className="px-6 py-3">Usable cost</th>
              <th className="px-6 py-3">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ingredient.priceHistory.map((entry, i) => {
              const previous = ingredient.priceHistory[i + 1];
              const changeBp = previous ? percentChangeBp(entry.costPerUsableUnitCents, previous.costPerUsableUnitCents) : null;
              return (
                <tr key={entry.id}>
                  <td className="px-6 py-3 text-slate-600">{formatDate(entry.effectiveDate, language)}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatMoney(entry.purchasePriceCents, currencyCode, language)} / {entry.purchaseQty}{" "}
                    {UNIT_LABEL[entry.purchaseUnit]}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {formatMoney(entry.costPerUsableUnitCents, currencyCode, language)}/{UNIT_LABEL[entry.purchaseUnit]}
                  </td>
                  <td className="px-6 py-3">
                    {changeBp === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className={changeBp > 0 ? "text-red-600" : changeBp < 0 ? "text-emerald-600" : "text-slate-500"}>
                        {changeBp > 0 ? "▲" : changeBp < 0 ? "▼" : "–"} {bpToPercentString(Math.abs(changeBp), 1)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
