"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { simulatePriceChange } from "@/lib/calculations/whatIf";
import { bpToPercentString } from "@/lib/calculations/money";

export function WhatIfSimulator({
  menuItemName,
  currentSellingPriceCents,
  foodCostCents,
  initialMonthlySalesUnits,
  currencyCode,
  language,
}: {
  menuItemName: string;
  currentSellingPriceCents: number;
  foodCostCents: number;
  initialMonthlySalesUnits: number;
  currencyCode: string;
  language: string;
}) {
  const [testPrice, setTestPrice] = useState((currentSellingPriceCents / 100).toFixed(2));
  const [monthlySales, setMonthlySales] = useState(String(initialMonthlySalesUnits));
  const t = useTranslations("menuItems");

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat(language === "ja" ? "ja-JP" : language === "es" ? "es-ES" : "en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(cents / 100);

  const result = useMemo(() => {
    const testPriceCents = Math.round(Number(testPrice) * 100);
    const units = Math.max(0, Math.round(Number(monthlySales) || 0));
    if (!Number.isFinite(testPriceCents) || testPriceCents <= 0) return null;

    return simulatePriceChange({
      currentSellingPriceCents,
      testSellingPriceCents: testPriceCents,
      foodCostCents,
      monthlySalesUnits: units,
    });
  }, [testPrice, monthlySales, currentSellingPriceCents, foodCostCents]);

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{menuItemName}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">{t("whatIfCurrentPrice")}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(currentSellingPriceCents)}</p>
          </div>
          <div>
            <label htmlFor="testPrice" className="block text-sm text-slate-500">
              {t("whatIfTestPrice")}
            </label>
            <input
              id="testPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={testPrice}
              onChange={(e) => setTestPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="monthlySales" className="block text-sm text-slate-500">
              {t("whatIfMonthlySales")}
            </label>
            <input
              id="monthlySales"
              type="number"
              step="1"
              min="0"
              value={monthlySales}
              onChange={(e) => setMonthlySales(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t("whatIfMonthlyContributionProfit")}</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-lg text-slate-400 line-through">{formatMoney(result.currentMonthlyContributionProfitCents)}</span>
              <span className="text-2xl font-semibold text-slate-900">{formatMoney(result.newMonthlyContributionProfitCents)}</span>
            </div>
            <p className={`mt-2 text-lg font-semibold ${result.differenceCents >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {t("whatIfPerMonthSuffix", {
                amount: `${result.differenceCents >= 0 ? "+" : ""}${formatMoney(result.differenceCents)}`,
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t("whatIfFoodCostPercent")}</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-lg text-slate-400 line-through">{bpToPercentString(result.currentFoodCostPercentBp, 1)}%</span>
              <span className="text-2xl font-semibold text-slate-900">{bpToPercentString(result.newFoodCostPercentBp, 1)}%</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">{t("whatIfDisclaimer")}</p>
    </div>
  );
}
