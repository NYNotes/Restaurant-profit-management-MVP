"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { LABOR_ROLES, type LaborRole } from "@/lib/laborRoles";
import type { LaborCostLineItemActionState } from "@/app/(app)/r/[restaurantId]/profit-loss/actions";

const initialState: LaborCostLineItemActionState = {};

export function LaborCostLineItemForm({
  action,
  year,
  month,
}: {
  action: (prevState: LaborCostLineItemActionState, formData: FormData) => Promise<LaborCostLineItemActionState>;
  year: number;
  month: number;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = useTranslations("profitLoss");
  const tc = useTranslations("common");
  const tRole = useTranslations("laborRole");

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <div className="w-44">
        <label htmlFor="role" className="block text-sm font-medium text-slate-700">
          {t("formRole")}
        </label>
        <select
          id="role"
          name="role"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {LABOR_ROLES.map((role: LaborRole) => (
            <option key={role} value={role}>
              {tRole(role)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[160px] flex-1">
        <label htmlFor="employeeName" className="block text-sm font-medium text-slate-700">
          {t("formEmployeeOptional")}
        </label>
        <input
          id="employeeName"
          name="employeeName"
          type="text"
          placeholder="Taro"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="w-32">
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
          {tc("amount")}
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? tc("adding") : tc("add")}
      </button>

      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
