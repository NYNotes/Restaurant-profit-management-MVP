"use client";

import { useActionState } from "react";
import { UNIT_GROUPS, UNIT_LABEL } from "@/lib/units-display";
import type { IngredientActionState } from "@/app/(app)/r/[restaurantId]/ingredients/actions";

const initialState: IngredientActionState = {};

export function IngredientForm({
  action,
  submitLabel,
  defaults,
}: {
  action: (prevState: IngredientActionState, formData: FormData) => Promise<IngredientActionState>;
  submitLabel: string;
  defaults?: {
    name: string;
    categoryName: string;
    vendorName: string;
    purchasePrice: string;
    purchaseQty: string;
    purchaseUnit: string;
    yieldPercent: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Ingredient name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaults?.name}
          placeholder="Salmon"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <input
            id="categoryName"
            name="categoryName"
            type="text"
            defaultValue={defaults?.categoryName}
            placeholder="Seafood"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700">
            Vendor
          </label>
          <input
            id="vendorName"
            name="vendorName"
            type="text"
            defaultValue={defaults?.vendorName}
            placeholder="Ocean Fresh Foods"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-slate-700">
            Purchase price
          </label>
          <input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaults?.purchasePrice}
            placeholder="145.00"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="purchaseQty" className="block text-sm font-medium text-slate-700">
            Purchase quantity
          </label>
          <input
            id="purchaseQty"
            name="purchaseQty"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaults?.purchaseQty}
            placeholder="10"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="purchaseUnit" className="block text-sm font-medium text-slate-700">
            Unit
          </label>
          <select
            id="purchaseUnit"
            name="purchaseUnit"
            required
            defaultValue={defaults?.purchaseUnit ?? "LB"}
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

      <div className="w-1/3">
        <label htmlFor="yieldPercent" className="block text-sm font-medium text-slate-700">
          Yield %
        </label>
        <input
          id="yieldPercent"
          name="yieldPercent"
          type="number"
          step="0.1"
          min="0.1"
          max="100"
          required
          defaultValue={defaults?.yieldPercent ?? "100"}
          placeholder="82"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-400">100% if there&apos;s no trim or prep loss.</p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
