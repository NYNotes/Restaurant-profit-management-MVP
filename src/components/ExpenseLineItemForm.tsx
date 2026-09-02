"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenseCategories";
import { PhotoScanButton } from "@/components/PhotoScanButton";
import { parseReceiptText } from "@/lib/ocrParsers";
import type { ExpenseLineItemActionState } from "@/app/(app)/r/[restaurantId]/expenses/actions";

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
  const t = useTranslations("profitLoss");
  const tc = useTranslations("common");
  const tExpCat = useTranslations("expenseCategory");

  const vendorNameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  function handleScanned(rawText: string) {
    const guess = parseReceiptText(rawText);
    if (guess.vendorName && vendorNameRef.current && !vendorNameRef.current.value) {
      vendorNameRef.current.value = guess.vendorName;
    }
    if (guess.amount && amountRef.current) amountRef.current.value = guess.amount;
  }

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <PhotoScanButton
        label={tc("scanPhoto")}
        scanningLabel={tc("scanning")}
        errorLabel={tc("scanError")}
        onScanned={handleScanned}
      />

      <div className="w-44">
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          {t("formCategory")}
        </label>
        <select
          id="category"
          name="category"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {EXPENSE_CATEGORIES.map((cat: ExpenseCategory) => (
            <option key={cat} value={cat}>
              {tExpCat(cat)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[160px] flex-1">
        <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700">
          {t("formVendorOptional")}
        </label>
        <input
          id="vendorName"
          name="vendorName"
          type="text"
          list="vendor-names"
          ref={vendorNameRef}
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
          {t("formDescriptionOptional")}
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
          {t("formAmount")}
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          ref={amountRef}
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
