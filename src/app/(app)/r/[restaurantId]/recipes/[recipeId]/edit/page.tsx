import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { RecipeShellForm } from "@/components/RecipeShellForm";
import { updateRecipeAction } from "../../actions";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ restaurantId: string; recipeId: string }>;
}) {
  const { restaurantId, recipeId } = await params;

  const [recipe, restaurant] = await Promise.all([
    db.recipe.findFirst({ where: { id: recipeId, restaurantId }, include: { category: true } }),
    db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } }),
  ]);
  if (!recipe) notFound();

  const t = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "recipes" });
  const tc = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "common" });
  const boundAction = updateRecipeAction.bind(null, restaurantId, recipeId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("editTitle", { name: recipe.name })}</h1>
      <RecipeShellForm
        action={boundAction}
        submitLabel={tc("saveChanges")}
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
