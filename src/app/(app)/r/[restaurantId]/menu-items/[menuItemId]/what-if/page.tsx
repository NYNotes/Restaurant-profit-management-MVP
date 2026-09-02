import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { computeRecipeCost } from "@/lib/recipeCosting";
import { currentYearMonth } from "@/lib/financialMonth";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";

export default async function WhatIfPage({
  params,
}: {
  params: Promise<{ restaurantId: string; menuItemId: string }>;
}) {
  const { restaurantId, menuItemId } = await params;

  const [restaurant, menuItem] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.menuItem.findFirst({ where: { id: menuItemId, restaurantId }, include: { recipe: true } }),
  ]);
  if (!menuItem) notFound();

  const language = restaurant.settings?.language ?? "en";
  const t = await getTranslations({ locale: language, namespace: "menuItems" });

  if (!menuItem.recipeId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t("whatIfTitle")}</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t("whatIfNoRecipe", { name: menuItem.name })}</p>
        </div>
      </div>
    );
  }

  const cost = await computeRecipeCost(menuItem.recipeId);

  const { year, month } = currentYearMonth();
  const financialMonth = await db.financialMonth.findUnique({ where: { restaurantId_year_month: { restaurantId, year, month } } });
  const monthlyStat = financialMonth
    ? await db.menuItemMonthlyStat.findUnique({ where: { menuItemId_financialMonthId: { menuItemId, financialMonthId: financialMonth.id } } })
    : null;

  return (
    <div>
      <p className="text-sm text-slate-400">
        <Link href={`/r/${restaurantId}/menu-items/${menuItemId}`} className="hover:underline">
          {menuItem.name}
        </Link>{" "}
        / {t("whatIfTitle")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{t("whatIfTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("whatIfSubtitle")}</p>

      <WhatIfSimulator
        menuItemName={menuItem.name}
        currentSellingPriceCents={menuItem.sellingPriceCents}
        foodCostCents={cost.costPerPortionCents}
        initialMonthlySalesUnits={monthlyStat?.unitsSold ?? 0}
        currencyCode={restaurant.settings?.currencyCode ?? "USD"}
        language={language}
      />
    </div>
  );
}
