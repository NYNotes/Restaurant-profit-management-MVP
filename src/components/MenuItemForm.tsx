"use client";

import { useActionState } from "react";
import type { MenuItemActionState } from "@/app/(app)/r/[restaurantId]/menu-items/actions";

const initialState: MenuItemActionState = {};

export function MenuItemForm({
  action,
  submitLabel,
  recipes,
  defaults,
}: {
  action: (prevState: MenuItemActionState, formData: FormData) => Promise<MenuItemActionState>;
  submitLabel: string;
  recipes: { id: string; name: string }[];
  defaults?: {
    name: string;
    categoryName: string;
    sellingPrice: string;
    recipeId: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Menu item name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaults?.name}
          placeholder="Wagyu Roll"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700">
          Category
        </label>
        <input
          id="categoryName"
          name="categoryName"
          type="text"
          defaultValue={defaults?.categoryName}
          placeholder="Rolls"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sellingPrice" className="block text-sm font-medium text-slate-700">
            Selling price
          </label>
          <input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaults?.sellingPrice}
            placeholder="24.00"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="recipeId" className="block text-sm font-medium text-slate-700">
            Recipe
          </label>
          <select
            id="recipeId"
            name="recipeId"
            defaultValue={defaults?.recipeId ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">No recipe yet</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
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
