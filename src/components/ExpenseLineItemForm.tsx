"use client";

import { useActionState } from "react";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/lib/expenseCategories";
import type { ExpenseLineItemActionState } from "@/app/(app)/r/[restaurantId]/profit-loss/actions";

const initialState: ExpenseLineItemActionState = {};

export function ExpenseLineItemForm({
  action,
  year,
  month,
  vendorNames,
}: {
  action: (prevState: ExpenseLineItemActionState, formData: FormData) => Promise<ExpenseLineItemActionState>;
  year: number;
  month: number;
  vendorNames: string[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <div className="w-44">
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {EXPENSE_CATEGORIES.map((cat: ExpenseCategory) => (
            <option key={cat} value={cat}>
              {EXPENSE_CATEGORY_LABEL[cat]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[160px] flex-1">
        <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700">
          Vendor <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="vendorName"
          name="vendorName"
          type="text"
          list="vendor-names"
          placeholder="Con Edison"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <datalist id="vendor-names">
          {vendorNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div className="min-w-[160px] flex-1">
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="March electric bill"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="w-32">
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
          Amount
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
        {pending ? "Adding…" : "Add"}
      </button>

      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
