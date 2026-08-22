import { getTranslations } from "next-intl/server";
import { formatMoney, localeForLanguage } from "@/lib/format";
import { bpToPercentString } from "@/lib/calculations/money";
import { percentChangeBp } from "@/lib/calculations/profitAndLoss";
import { getDashboardData } from "@/lib/dashboardData";
import { StatCard } from "@/components/StatCard";
import { FoodCostStatusBadge } from "@/components/FoodCostStatusBadge";
import { foodCostStatus } from "@/lib/calculations/menuItem";

export default async function DashboardPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const { restaurant, year, month, pl, prevPl, needsAttention, topProfitItems } = await getDashboardData(restaurantId);

  const settings = restaurant.settings;
  const currencyCode = settings?.currencyCode ?? "USD";
  const language = settings?.language ?? "en";
  const targetBp = settings?.targetFoodCostBp ?? 3000;

  const t = await getTranslations({ locale: language, namespace: "dashboard" });
  const tStatus = await getTranslations({ locale: language, namespace: "foodCostStatus" });
  const monthLabel = new Intl.DateTimeFormat(localeForLanguage(language), { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );

  const foodCostBp = pl.foodCost.percentOfSalesBp;
  const laborBp = pl.laborCost.percentOfSalesBp;
  const primeCostBp = pl.primeCost.percentOfSalesBp;

  const foodStatus = foodCostStatus({
    foodCostPercentBp: foodCostBp,
    targetFoodCostBp: targetBp,
    warningThresholdBp: settings?.foodCostWarningBp ?? 300,
    highThresholdBp: settings?.foodCostHighBp ?? 700,
  });

  const revenueChangeBp = prevPl ? percentChangeBp(pl.revenue.amountCents, prevPl.revenue.amountCents) : null;
  const netProfitChangeBp = prevPl ? percentChangeBp(pl.netProfit.amountCents, prevPl.netProfit.amountCents) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{restaurant.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("monthlySales")}
          value={formatMoney(pl.revenue.amountCents, currencyCode, language)}
          trend={revenueChangeBp !== null ? { changeBp: revenueChangeBp, goodDirection: "up", label: t("vsPreviousMonth") } : undefined}
        />
        <StatCard
          label={t("netProfit")}
          value={formatMoney(pl.netProfit.amountCents, currencyCode, language)}
          sublabel={`${bpToPercentString(pl.netProfit.percentOfSalesBp, 1)}% ${t("margin")}`}
          trend={netProfitChangeBp !== null ? { changeBp: netProfitChangeBp, goodDirection: "up", label: t("vsPreviousMonth") } : undefined}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{t("foodCostPercent")}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{bpToPercentString(foodCostBp, 1)}%</p>
          <div className="mt-1">
            <FoodCostStatusBadge status={foodStatus} label={tStatus(foodStatus.toLowerCase())} />
          </div>
        </div>
        <StatCard label={t("laborCostPercent")} value={`${bpToPercentString(laborBp, 1)}%`} />
        <StatCard
          label={t("primeCostPercent")}
          value={`${bpToPercentString(primeCostBp, 1)}%`}
          sublabel={primeCostBp >= 6500 ? t("needsAttentionLabel") : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("needsAttention")}</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {needsAttention.length === 0 ? (
              <p className="px-6 py-6 text-sm text-slate-500">{t("nothingNeedsAttention")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {needsAttention.map((item, i) => (
                  <li key={i} className="px-6 py-3 text-sm text-slate-700">
                    {item.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("topProfitItems")}</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topProfitItems.length === 0 ? (
              <p className="px-6 py-6 text-sm text-slate-500">{t("noSalesRecorded")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topProfitItems.map((item) => (
                  <li key={item.name} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.unitsSold} {t("plates")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatMoney(item.profitCents, currencyCode, language)} {t("profit")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
