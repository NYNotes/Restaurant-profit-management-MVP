"use client";

import { useActionState } from "react";
import type { SettingsActionState } from "@/app/(app)/r/[restaurantId]/settings/actions";

const initialState: SettingsActionState = {};

export function SettingsForm({
  action,
  defaults,
}: {
  action: (prevState: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  defaults: {
    restaurantName: string;
    language: string;
    currencyCode: string;
    measurementSystem: string;
    targetFoodCostPercent: string;
    foodCostWarningPercent: string;
    foodCostHighPercent: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="restaurantName" className="block text-sm font-medium text-slate-700">
          Restaurant name
        </label>
        <input
          id="restaurantName"
          name="restaurantName"
          type="text"
          required
          defaultValue={defaults.restaurantName}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-slate-700">
            Language
          </label>
          <select
            id="language"
            name="language"
            defaultValue={defaults.language}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div>
          <label htmlFor="currencyCode" className="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <select
            id="currencyCode"
            name="currencyCode"
            defaultValue={defaults.currencyCode}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="USD">USD ($)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <div>
          <label htmlFor="measurementSystem" className="block text-sm font-medium text-slate-700">
            Measurement
          </label>
          <select
            id="measurementSystem"
            name="measurementSystem"
            defaultValue={defaults.measurementSystem}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="US">US (lb, oz, gal)</option>
            <option value="METRIC">Metric (kg, g, L)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="targetFoodCostPercent" className="block text-sm font-medium text-slate-700">
            Target food cost %
          </label>
          <input
            id="targetFoodCostPercent"
            name="targetFoodCostPercent"
            type="number"
            step="0.1"
            min="1"
            max="100"
            required
            defaultValue={defaults.targetFoodCostPercent}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="foodCostWarningPercent" className="block text-sm font-medium text-slate-700">
            Warning threshold (pts over target)
          </label>
          <input
            id="foodCostWarningPercent"
            name="foodCostWarningPercent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            required
            defaultValue={defaults.foodCostWarningPercent}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="foodCostHighPercent" className="block text-sm font-medium text-slate-700">
            High threshold (pts over target)
          </label>
          <input
            id="foodCostHighPercent"
            name="foodCostHighPercent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            required
            defaultValue={defaults.foodCostHighPercent}
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
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
