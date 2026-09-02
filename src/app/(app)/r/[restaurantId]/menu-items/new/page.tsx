import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { MenuItemForm } from "@/components/MenuItemForm";
import { createMenuItemAction } from "../actions";

export default async function NewMenuItemPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const boundAction = createMenuItemAction.bind(null, restaurantId);

  const [recipes, restaurant] = await Promise.all([
    db.recipe.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
  ]);
  const t = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "menuItems" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("addMenuItem")}</h1>
      <MenuItemForm action={boundAction} submitLabel={t("addMenuItem")} recipes={recipes} />
    </div>
  );
}
