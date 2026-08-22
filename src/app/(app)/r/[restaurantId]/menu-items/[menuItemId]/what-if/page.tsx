import Link from "next/link";
import { notFound } from "next/navigation";
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

  if (!menuItem.recipeId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">What-If Simulator</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Assign a recipe to {menuItem.name} first so it has a food cost to simulate against.</p>
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
        / What-If Simulator
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">What-If Simulator</h1>
      <p className="mt-1 text-sm text-slate-500">Test a different selling price without changing this menu item.</p>

      <WhatIfSimulator
        menuItemName={menuItem.name}
        currentSellingPriceCents={menuItem.sellingPriceCents}
        foodCostCents={cost.costPerPortionCents}
        initialMonthlySalesUnits={monthlyStat?.unitsSold ?? 0}
        currencyCode={restaurant.settings?.currencyCode ?? "USD"}
        language={restaurant.settings?.language ?? "en"}
      />
    </div>
  );
}
