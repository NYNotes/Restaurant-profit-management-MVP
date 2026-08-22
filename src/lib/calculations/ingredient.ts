/**
 * Cost per usable unit (in the purchase unit) = purchase cost per purchase unit / yield.
 * Example: Salmon — $145 for 10 lb, 82% yield → $14.50/lb purchase cost, $17.68/lb usable cost.
 * "Usable quantity" is a derived display value (purchaseQty * yield), not an independent
 * input — see usableQty() below — so cost and displayed quantity never disagree.
 *
 * Deliberately NOT rounded to whole cents: this is a per-unit rate, not a money total.
 * Many ingredients (sauces, spices, oils) are purchased in bulk and used in small units
 * like grams/ml, where the true rate is well under one cent (e.g. $0.005/g) — rounding
 * that to the nearest cent here would silently double downstream recipe costs. Round
 * only at genuine money-total boundaries (a component's cost, a recipe's total cost),
 * which recipe.ts already does.
 */
export function usableCostPerUnit(params: {
  purchasePriceCents: number;
  purchaseQty: number;
  yieldBp: number;
}): number {
  const { purchasePriceCents, purchaseQty, yieldBp } = params;
  if (purchaseQty <= 0 || yieldBp <= 0) return 0;

  const costPerPurchaseUnit = purchasePriceCents / purchaseQty;
  return costPerPurchaseUnit / (yieldBp / 10000);
}

export function usableQty(purchaseQty: number, yieldBp: number): number {
  return purchaseQty * (yieldBp / 10000);
}
