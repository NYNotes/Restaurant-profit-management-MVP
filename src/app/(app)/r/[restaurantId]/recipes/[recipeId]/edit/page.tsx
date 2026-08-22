import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RecipeShellForm } from "@/components/RecipeShellForm";
import { updateRecipeAction } from "../../actions";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ restaurantId: string; recipeId: string }>;
}) {
  const { restaurantId, recipeId } = await params;

  const recipe = await db.recipe.findFirst({ where: { id: recipeId, restaurantId }, include: { category: true } });
  if (!recipe) notFound();

  const boundAction = updateRecipeAction.bind(null, restaurantId, recipeId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Edit {recipe.name}</h1>
      <RecipeShellForm
        action={boundAction}
        submitLabel="Save changes"
        defaults={{
          name: recipe.name,
          categoryName: recipe.category?.name ?? "",
          yieldQty: recipe.yieldQty.toString(),
          yieldUnit: recipe.yieldUnit,
          portionSize: recipe.portionSize?.toString() ?? "",
          portionCount: recipe.portionCount?.toString() ?? "",
          isSubRecipe: recipe.isSubRecipe,
        }}
      />
    </div>
  );
}
