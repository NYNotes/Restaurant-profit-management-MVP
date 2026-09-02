import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { MenuItemForm } from "@/components/MenuItemForm";
import { updateMenuItemAction } from "../../actions";

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ restaurantId: string; menuItemId: string }>;
}) {
  const { restaurantId, menuItemId } = await params;

  const [menuItem, recipes, restaurant] = await Promise.all([
    db.menuItem.findFirst({ where: { id: menuItemId, restaurantId }, include: { category: true } }),
    db.recipe.findMany({ where: { restaurantId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
  ]);
  if (!menuItem) notFound();

  const t = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "menuItems" });
  const tc = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "common" });
  const boundAction = updateMenuItemAction.bind(null, restaurantId, menuItemId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("editTitle", { name: menuItem.name })}</h1>
      <MenuItemForm
        action={boundAction}
        submitLabel={tc("saveChanges")}
        recipes={recipes}
        defaults={{
          name: menuItem.name,
          categoryName: menuItem.category?.name ?? "",
          sellingPrice: (menuItem.sellingPriceCents / 100).toString(),
          recipeId: menuItem.recipeId ?? "",
        }}
      />
    </div>
  );
}
