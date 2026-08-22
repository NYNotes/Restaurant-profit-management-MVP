"use client";

import { useActionState } from "react";
import type { UnitsSoldActionState } from "@/app/(app)/r/[restaurantId]/menu-items/actions";

const initialState: UnitsSoldActionState = {};

export function UnitsSoldForm({
  action,
  currentUnitsSold,
  monthLabel,
}: {
  action: (prevState: UnitsSoldActionState, formData: FormData) => Promise<UnitsSoldActionState>;
  currentUnitsSold: number | null;
  monthLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="w-40">
        <label htmlFor="unitsSold" className="block text-sm font-medium text-slate-700">
          Units sold — {monthLabel}
        </label>
        <input
          id="unitsSold"
          name="unitsSold"
          type="number"
          step="1"
          min="0"
          required
          defaultValue={currentUnitsSold ?? undefined}
          placeholder="450"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : currentUnitsSold === null ? "Save" : "Update"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
