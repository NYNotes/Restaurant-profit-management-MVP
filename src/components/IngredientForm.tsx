"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { UNIT_GROUPS, UNIT_LABEL } from "@/lib/units-display";
import { PhotoScanButton } from "@/components/PhotoScanButton";
import { IngredientPresetPicker } from "@/components/IngredientPresetPicker";
import { VendorPicker } from "@/components/VendorPicker";
import { parseIngredientLabelText } from "@/lib/ocrParsers";
import type { IngredientActionState } from "@/app/(app)/r/[restaurantId]/ingredients/actions";

const initialState: IngredientActionState = {};

export function IngredientForm({
  action,
  submitLabel,
  restaurantId,
  customPresets,
  customCategories,
  vendorNames,
  defaults,
}: {
  action: (prevState: IngredientActionState, formData: FormData) => Promise<IngredientActionState>;
  submitLabel: string;
  restaurantId: string;
  customPresets: { id: string; categoryKey: string | null; customCategoryId: string | null; name: string }[];
  customCategories: { id: string; name: string }[];
  vendorNames: string[];
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
  const t = useTranslations("ingredients");
  const tc = useTranslations("common");

  const nameRef = useRef<HTMLInputElement>(null);
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const vendorNameRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const purchaseQtyRef = useRef<HTMLInputElement>(null);

  function handleScanned(rawText: string) {
    const guess = parseIngredientLabelText(rawText);
    if (guess.name && nameRef.current && !nameRef.current.value) nameRef.current.value = guess.name;
    if (guess.vendorName && vendorNameRef.current && !vendorNameRef.current.value) vendorNameRef.current.value = guess.vendorName;
    if (guess.purchasePrice && purchasePriceRef.current) purchasePriceRef.current.value = guess.purchasePrice;
    if (guess.purchaseQty && purchaseQtyRef.current) purchaseQtyRef.current.value = guess.purchaseQty;
  }

  function handlePreset(name: string, categoryName: string) {
    if (nameRef.current) nameRef.current.value = name;
    if (categoryNameRef.current) categoryNameRef.current.value = categoryName;
  }

  function handleVendorPick(name: string) {
    if (vendorNameRef.current) vendorNameRef.current.value = name;
  }

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <PhotoScanButton
        label={tc("scanPhoto")}
        scanningLabel={tc("scanning")}
        errorLabel={tc("scanError")}
        onScanned={handleScanned}
      />

      <IngredientPresetPicker
        restaurantId={restaurantId}
        customPresets={customPresets}
        customCategories={customCategories}
        onPick={handlePreset}
      />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          {t("formName")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          ref={nameRef}
          defaultValue={defaults?.name}
          placeholder="Salmon"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700">
            {tc("category")}
          </label>
          <input
            id="categoryName"
            name="categoryName"
            type="text"
            ref={categoryNameRef}
            defaultValue={defaults?.categoryName}
            placeholder="Seafood"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700">
            {tc("vendor")}
          </label>
          <input
            id="vendorName"
            name="vendorName"
            type="text"
            ref={vendorNameRef}
            defaultValue={defaults?.vendorName}
            placeholder="Ocean Fresh Foods"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <div className="mt-2">
            <VendorPicker vendorNames={vendorNames} onPick={handleVendorPick} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-slate-700">
            {t("formPurchasePrice")}
          </label>
          <input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0.01"
            required
            ref={purchasePriceRef}
            defaultValue={defaults?.purchasePrice}
            placeholder="145.00"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="purchaseQty" className="block text-sm font-medium text-slate-700">
            {t("formPurchaseQuantity")}
          </label>
          <input
            id="purchaseQty"
            name="purchaseQty"
            type="number"
            step="0.01"
            min="0.01"
            required
            ref={purchaseQtyRef}
            defaultValue={defaults?.purchaseQty}
            placeholder="10"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="purchaseUnit" className="block text-sm font-medium text-slate-700">
            {tc("unit")}
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

      <div className="w-full sm:w-1/3">
        <label htmlFor="yieldPercent" className="block text-sm font-medium text-slate-700">
          {t("formYieldPercent")}
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
        <p className="mt-1 text-xs text-slate-400">{t("formYieldHint")}</p>
      </div>

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
