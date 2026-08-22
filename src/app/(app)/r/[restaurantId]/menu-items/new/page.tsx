import { db } from "@/lib/db";
import { MenuItemForm } from "@/components/MenuItemForm";
import { createMenuItemAction } from "../actions";

export default async function NewMenuItemPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const boundAction = createMenuItemAction.bind(null, restaurantId);

  const recipes = await db.recipe.findMany({
    where: { restaurantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Add menu item</h1>
      <MenuItemForm action={boundAction} submitLabel="Add menu item" recipes={recipes} />
    </div>
  );
}
