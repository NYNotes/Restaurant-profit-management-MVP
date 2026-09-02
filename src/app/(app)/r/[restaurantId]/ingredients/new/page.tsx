import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { IngredientForm } from "@/components/IngredientForm";
import { createIngredientAction } from "../actions";

export default async function NewIngredientPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const boundAction = createIngredientAction.bind(null, restaurantId);

  const [restaurant, customPresets, customCategories, vendors] = await Promise.all([
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.ingredientPreset.findMany({ where: { restaurantId }, orderBy: { name: "asc" } }),
    db.ingredientPresetCategory.findMany({ where: { restaurantId }, orderBy: { name: "asc" } }),
    db.vendor.findMany({ where: { restaurantId }, orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  const t = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "ingredients" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("addIngredient")}</h1>
      <IngredientForm
        action={boundAction}
        submitLabel={t("addIngredient")}
        restaurantId={restaurantId}
        customPresets={customPresets.map((p) => ({
          id: p.id,
          categoryKey: p.categoryKey,
          customCategoryId: p.customCategoryId,
          name: p.name,
        }))}
        customCategories={customCategories.map((c) => ({ id: c.id, name: c.name }))}
        vendorNames={vendors.map((v) => v.name)}
      />
    </div>
  );
}
