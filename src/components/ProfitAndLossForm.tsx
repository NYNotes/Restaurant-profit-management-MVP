"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { FinancialMonthActionState } from "@/app/(app)/r/[restaurantId]/profit-loss/actions";

const initialState: FinancialMonthActionState = {};

export function ProfitAndLossForm({
  action,
  year,
  month,
  defaults,
}: {
  action: (prevState: FinancialMonthActionState, formData: FormData) => Promise<FinancialMonthActionState>;
  year: number;
  month: number;
  defaults: { revenue: string; foodCost: string };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = useTranslations("profitLoss");
  const tc = useTranslations("common");

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="revenue" className="block text-sm font-medium text-slate-700">
            {t("formRevenue")}
          </label>
          <input
            id="revenue"
            name="revenue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.revenue}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="foodCost" className="block text-sm font-medium text-slate-700">
            {t("formFoodCost")}
          </label>
          <input
            id="foodCost"
            name="foodCost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.foodCost}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? tc("saving") : tc("save")}
      </button>
    </form>
  );
}
