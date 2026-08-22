import { IngredientForm } from "@/components/IngredientForm";
import { createIngredientAction } from "../actions";

export default async function NewIngredientPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const boundAction = createIngredientAction.bind(null, restaurantId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Add ingredient</h1>
      <IngredientForm action={boundAction} submitLabel="Add ingredient" />
    </div>
  );
}
