"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { UNIT_GROUPS, UNIT_LABEL } from "@/lib/units-display";
import type { RecipeActionState } from "@/app/(app)/r/[restaurantId]/recipes/actions";

const initialState: RecipeActionState = {};

export function RecipeShellForm({
  action,
  submitLabel,
  defaults,
}: {
  action: (prevState: RecipeActionState, formData: FormData) => Promise<RecipeActionState>;
  submitLabel: string;
  defaults?: {
    name: string;
    categoryName: string;
    yieldQty: string;
    yieldUnit: string;
    portionSize: string;
    portionCount: string;
    isSubRecipe: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = useTranslations("recipes");
  const tc = useTranslations("common");

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          {t("formName")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaults?.name}
          placeholder="Spicy Mayo"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700">
          {tc("category")}
        </label>
        <input
          id="categoryName"
          name="categoryName"
          type="text"
          defaultValue={defaults?.categoryName}
          placeholder="Sauces"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="yieldQty" className="block text-sm font-medium text-slate-700">
            {t("formTotalYield")}
          </label>
          <input
            id="yieldQty"
            name="yieldQty"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaults?.yieldQty}
            placeholder="1000"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="yieldUnit" className="block text-sm font-medium text-slate-700">
            {t("formYieldUnit")}
          </label>
          <select
            id="yieldUnit"
            name="yieldUnit"
            required
            defaultValue={defaults?.yieldUnit ?? "G"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {UNIT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.units.map((unit) => (
                  <option key={unit} value={unit}>
                    {UNIT_LABEL[unit]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="portionSize" className="block text-sm font-medium text-slate-700">
            {t("formPortionSize")} <span className="text-slate-400">{tc("optional")}</span>
          </label>
          <input
            id="portionSize"
            name="portionSize"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={defaults?.portionSize}
            placeholder="in yield units"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="portionCount" className="block text-sm font-medium text-slate-700">
            {t("formPortionCount")} <span className="text-slate-400">{tc("optional")}</span>
          </label>
          <input
            id="portionCount"
            name="portionCount"
            type="number"
            step="1"
            min="1"
            defaultValue={defaults?.portionCount}
            placeholder="e.g. 12"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-slate-400">{t("formPortionHint")}</p>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isSubRecipe" defaultChecked={defaults?.isSubRecipe} className="h-4 w-4 rounded border-slate-300" />
        {t("formIsSubRecipe")}
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? tc("saving") : submitLabel}
      </button>
    </form>
  );
}
