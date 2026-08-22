import { RecipeShellForm } from "@/components/RecipeShellForm";
import { createRecipeAction } from "../actions";

export default async function NewRecipePage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const boundAction = createRecipeAction.bind(null, restaurantId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Add recipe</h1>
      <RecipeShellForm action={boundAction} submitLabel="Create recipe" />
    </div>
  );
}
