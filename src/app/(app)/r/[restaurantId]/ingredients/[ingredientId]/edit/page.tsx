import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { bpToPercentString } from "@/lib/calculations/money";
import { IngredientForm } from "@/components/IngredientForm";
import { updateIngredientAction } from "../../actions";

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ restaurantId: string; ingredientId: string }>;
}) {
  const { restaurantId, ingredientId } = await params;

  const [ingredient, restaurant, customPresets, customCategories, vendors] = await Promise.all([
    db.ingredient.findFirst({ where: { id: ingredientId, restaurantId }, include: { category: true, vendor: true } }),
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
    db.ingredientPreset.findMany({ where: { restaurantId }, orderBy: { name: "asc" } }),
    db.ingredientPresetCategory.findMany({ where: { restaurantId }, orderBy: { name: "asc" } }),
    db.vendor.findMany({ where: { restaurantId }, orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  if (!ingredient) notFound();

  const t = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "ingredients" });
  const tc = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "common" });
  const boundAction = updateIngredientAction.bind(null, restaurantId, ingredientId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("editTitle", { name: ingredient.name })}</h1>
      <IngredientForm
        action={boundAction}
        submitLabel={tc("saveChanges")}
        restaurantId={restaurantId}
        customPresets={customPresets.map((p) => ({
          id: p.id,
          categoryKey: p.categoryKey,
          customCategoryId: p.customCategoryId,
          name: p.name,
        }))}
        customCategories={customCategories.map((c) => ({ id: c.id, name: c.name }))}
        vendorNames={vendors.map((v) => v.name)}
        defaults={{
          name: ingredient.name,
          categoryName: ingredient.category?.name ?? "",
          vendorName: ingredient.vendor?.name ?? "",
          purchasePrice: (ingredient.purchasePriceCents / 100).toString(),
          purchaseQty: ingredient.purchaseQty.toString(),
          purchaseUnit: ingredient.purchaseUnit,
          yieldPercent: bpToPercentString(ingredient.yieldBp, 1),
        }}
      />
    </div>
  );
}
