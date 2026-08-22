"use client";

import { useActionState } from "react";
import { createRestaurantAction, type SetupActionState } from "../actions";

const initialState: SetupActionState = {};

export default function NewRestaurantPage() {
  const [state, formAction, pending] = useActionState(createRestaurantAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Set up your restaurant</h1>
        <p className="mt-1 text-sm text-slate-500">
          These can be changed later in Settings. Language, currency, and measurement units are independent.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="restaurantName" className="block text-sm font-medium text-slate-700">
              Restaurant name
            </label>
            <input
              id="restaurantName"
              name="restaurantName"
              type="text"
              required
              placeholder="Jukai NY"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-700">
                Language
              </label>
              <select
                id="language"
                name="language"
                defaultValue="en"
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
                defaultValue="USD"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="measurementSystem" className="block text-sm font-medium text-slate-700">
                Measurement
              </label>
              <select
                id="measurementSystem"
                name="measurementSystem"
                defaultValue="US"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="US">US (lb, oz, gal)</option>
                <option value="METRIC">Metric (kg, g, L)</option>
              </select>
            </div>
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
                defaultValue="30"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create restaurant"}
          </button>
        </form>
      </div>
    </div>
  );
}
