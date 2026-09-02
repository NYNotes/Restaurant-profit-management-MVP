"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { UNIT_GROUPS, UNIT_LABEL } from "@/lib/units-display";
import { unitDimension } from "@/lib/calculations/units";
import type { ComponentActionState } from "@/app/(app)/r/[restaurantId]/recipes/actions";

const initialState: ComponentActionState = {};

type OptionItem = { id: string; name: string; unit: string };

export function RecipeComponentForm({
  action,
  options,
}: {
  action: (prevState: ComponentActionState, formData: FormData) => Promise<ComponentActionState>;
  options: { ingredients: OptionItem[]; subRecipes: OptionItem[] };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = useTranslations("recipes");
  const tc = useTranslations("common");

  const allOptions = useMemo(
    () => [
      ...options.ingredients.map((o) => ({ ...o, ref: `ingredient:${o.id}` })),
      ...options.subRecipes.map((o) => ({ ...o, ref: `recipe:${o.id}` })),
    ],
    [options],
  );

  const [componentRef, setComponentRef] = useState(allOptions[0]?.ref ?? "");
  const selected = allOptions.find((o) => o.ref === componentRef);
  const compatibleGroups = selected
    ? UNIT_GROUPS.filter((group) => group.units.some((u) => unitDimension(u) === unitDimension(selected.unit)))
    : UNIT_GROUPS;

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-[220px] flex-1">
        <label htmlFor="componentRef" className="block text-sm font-medium text-slate-700">
          {t("componentSelectLabel")}
        </label>
        <select
          id="componentRef"
          name="componentRef"
          required
          value={componentRef}
          onChange={(e) => setComponentRef(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {options.ingredients.length > 0 && (
            <optgroup label={t("optgroupIngredients")}>
              {options.ingredients.map((ing) => (
                <option key={ing.id} value={`ingredient:${ing.id}`}>
                  {ing.name}
                </option>
              ))}
            </optgroup>
          )}
          {options.subRecipes.length > 0 && (
            <optgroup label={t("optgroupSubRecipes")}>
              {options.subRecipes.map((r) => (
                <option key={r.id} value={`recipe:${r.id}`}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="w-28">
        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
          {tc("quantity")}
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="w-32">
        <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
          {tc("unit")}
        </label>
        <select
          id="unit"
          name="unit"
          required
          key={selected?.unit ?? "default"}
          defaultValue={selected?.unit ?? "G"}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {compatibleGroups.map((group) => (
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
