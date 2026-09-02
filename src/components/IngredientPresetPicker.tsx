"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { INGREDIENT_PRESET_CATEGORIES, type LocalizedName } from "@/lib/ingredientPresets";
import {
  addIngredientPresetAction,
  removeIngredientPresetAction,
  addIngredientPresetCategoryAction,
  removeIngredientPresetCategoryAction,
} from "@/app/(app)/r/[restaurantId]/ingredients/actions";

function localized(name: LocalizedName, locale: string): string {
  if (locale === "ja") return name.ja;
  if (locale === "es") return name.es;
  return name.en;
}

type ActiveCategory = { kind: "builtin"; key: string } | { kind: "custom"; id: string } | null;

export function IngredientPresetPicker({
  restaurantId,
  customPresets: initialCustomPresets,
  customCategories: initialCustomCategories,
  onPick,
}: {
  restaurantId: string;
  customPresets: { id: string; categoryKey: string | null; customCategoryId: string | null; name: string }[];
  customCategories: { id: string; name: string }[];
  onPick: (name: string, categoryName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActiveCategory>(null);
  const [customPresets, setCustomPresets] = useState(initialCustomPresets);
  const [customCategories, setCustomCategories] = useState(initialCustomCategories);
  const [itemDraft, setItemDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const locale = useLocale();
  const t = useTranslations("ingredientPresets");
  const tc = useTranslations("common");

  const builtinCategory = active?.kind === "builtin" ? INGREDIENT_PRESET_CATEGORIES.find((c) => c.key === active.key) : undefined;
  const customCategory = active?.kind === "custom" ? customCategories.find((c) => c.id === active.id) : undefined;
  const activeLabel = builtinCategory ? localized(builtinCategory.label, locale) : (customCategory?.name ?? "");

  const customItemsForActive = customPresets.filter((p) =>
    active?.kind === "builtin" ? p.categoryKey === active.key : active?.kind === "custom" ? p.customCategoryId === active.id : false,
  );

  async function handleAddItem() {
    const name = itemDraft.trim();
    if (!name || !active || busy) return;
    setBusy(true);
    const created = await addIngredientPresetAction(
      restaurantId,
      active.kind === "builtin" ? { kind: "builtin", key: active.key } : { kind: "custom", id: active.id },
      name,
    );
    setBusy(false);
    if (created) {
      setCustomPresets((prev) => [...prev, created]);
      setItemDraft("");
    }
  }

  async function handleRemoveItem(id: string) {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
    await removeIngredientPresetAction(restaurantId, id);
  }

  async function handleAddCategory() {
    const name = categoryDraft.trim();
    if (!name || busy) return;
    setBusy(true);
    const created = await addIngredientPresetCategoryAction(restaurantId, name);
    setBusy(false);
    if (created) {
      setCustomCategories((prev) => [...prev, created]);
      setCategoryDraft("");
      setActive({ kind: "custom", id: created.id });
    }
  }

  async function handleRemoveCategory(id: string) {
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    setCustomPresets((prev) => prev.filter((p) => p.customCategoryId !== id));
    if (active?.kind === "custom" && active.id === id) setActive(null);
    await removeIngredientPresetCategoryAction(restaurantId, id);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-slate-700 hover:underline"
      >
        {open ? t("hide") : t("browse")}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {INGREDIENT_PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActive(active?.kind === "builtin" && active.key === cat.key ? null : { kind: "builtin", key: cat.key })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active?.kind === "builtin" && active.key === cat.key
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {localized(cat.label, locale)}
              </button>
            ))}
            {customCategories.map((cat) => (
              <span
                key={cat.id}
                className={`flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium transition ${
                  active?.kind === "custom" && active.id === cat.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActive(active?.kind === "custom" && active.id === cat.id ? null : { kind: "custom", id: cat.id })}
                >
                  {cat.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat.id)}
                  aria-label={tc("remove")}
                  className={`rounded-full px-1 hover:text-red-600 ${
                    active?.kind === "custom" && active.id === cat.id ? "text-slate-300 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 border-t border-slate-200 pt-3">
            <input
              type="text"
              value={categoryDraft}
              onChange={(e) => setCategoryDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              placeholder={t("addCategoryPlaceholder")}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={!categoryDraft.trim() || busy}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {tc("add")}
            </button>
          </div>

          {active && (
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex flex-wrap gap-2">
                {builtinCategory?.items.map((item) => (
                  <button
                    key={item.en}
                    type="button"
                    onClick={() => onPick(localized(item, locale), activeLabel)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white"
                  >
                    {localized(item, locale)}
                  </button>
                ))}
                {customItemsForActive.map((item) => (
                  <span
                    key={item.id}
                    className="flex items-center gap-1 rounded-full border border-slate-300 bg-white pl-3 pr-1.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <button type="button" onClick={() => onPick(item.name, activeLabel)} className="hover:underline">
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={tc("remove")}
                      className="rounded-full px-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={itemDraft}
                  onChange={(e) => setItemDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  placeholder={t("addPlaceholder")}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!itemDraft.trim() || busy}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {tc("add")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
