import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { UNIT_LABEL } from "@/lib/units-display";
import { bpToPercentString } from "@/lib/calculations/money";

export default async function IngredientsPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  const [restaurant, ingredients] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.ingredient.findMany({
      where: { restaurantId },
      include: { category: true, vendor: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const currencyCode = restaurant.settings?.currencyCode ?? "USD";
  const language = restaurant.settings?.language ?? "en";
  const [t, tc] = await Promise.all([
    getTranslations({ locale: language, namespace: "ingredients" }),
    getTranslations({ locale: language, namespace: "common" }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <Link
          href={`/r/${restaurantId}/ingredients/new`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {t("addIngredient")}
        </Link>
      </div>

      {ingredients.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t("emptyTitle")}</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3">{t("colName")}</th>
                <th className="px-6 py-3">{tc("category")}</th>
                <th className="px-6 py-3">{tc("vendor")}</th>
                <th className="px-6 py-3">{t("colPurchase")}</th>
                <th className="px-6 py-3">{t("colYield")}</th>
                <th className="px-6 py-3">{t("colUsableCost")}</th>
                <th className="px-6 py-3">{t("colUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/r/${restaurantId}/ingredients/${ing.id}`} className="font-medium text-slate-900 hover:underline">
                      {ing.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{ing.category?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-slate-600">{ing.vendor?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {ing.purchaseQty} {UNIT_LABEL[ing.purchaseUnit]} / {formatMoney(ing.purchasePriceCents, currencyCode, language)}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{bpToPercentString(ing.yieldBp, 0)}%</td>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {formatMoney(ing.costPerUsableUnitCents, currencyCode, language)}/{UNIT_LABEL[ing.purchaseUnit]}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(ing.lastUpdatedAt, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
