import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { RecipeShellForm } from "@/components/RecipeShellForm";
import { createRecipeAction } from "../actions";

export default async function NewRecipePage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const boundAction = createRecipeAction.bind(null, restaurantId);

  const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, include: { settings: true } });
  const t = await getTranslations({ locale: restaurant.settings?.language ?? "en", namespace: "recipes" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("addRecipe")}</h1>
      <RecipeShellForm action={boundAction} submitLabel={t("createSubmit")} />
    </div>
  );
}
