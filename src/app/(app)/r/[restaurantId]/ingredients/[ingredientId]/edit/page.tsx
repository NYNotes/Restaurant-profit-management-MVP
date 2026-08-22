import { notFound } from "next/navigation";
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

  const ingredient = await db.ingredient.findFirst({
    where: { id: ingredientId, restaurantId },
    include: { category: true, vendor: true },
  });
  if (!ingredient) notFound();

  const boundAction = updateIngredientAction.bind(null, restaurantId, ingredientId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Edit {ingredient.name}</h1>
      <IngredientForm
        action={boundAction}
        submitLabel="Save changes"
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
