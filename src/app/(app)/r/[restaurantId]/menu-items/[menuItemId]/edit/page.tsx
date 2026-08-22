import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MenuItemForm } from "@/components/MenuItemForm";
import { updateMenuItemAction } from "../../actions";

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ restaurantId: string; menuItemId: string }>;
}) {
  const { restaurantId, menuItemId } = await params;

  const [menuItem, recipes] = await Promise.all([
    db.menuItem.findFirst({ where: { id: menuItemId, restaurantId }, include: { category: true } }),
    db.recipe.findMany({ where: { restaurantId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!menuItem) notFound();

  const boundAction = updateMenuItemAction.bind(null, restaurantId, menuItemId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Edit {menuItem.name}</h1>
      <MenuItemForm
        action={boundAction}
        submitLabel="Save changes"
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
