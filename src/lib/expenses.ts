import { db } from "@/lib/db";
import type { FinancialMonthInput } from "@/lib/calculations/profitAndLoss";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenseCategories";

export { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/lib/expenseCategories";

/** Sums this month's vendor line items into the category totals the P&L engine expects. */
export async function aggregateExpensesByCategory(financialMonthId: string): Promise<Record<ExpenseCategory, number>> {
  const totals = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, 0])) as Record<ExpenseCategory, number>;

  const grouped = await db.expenseLineItem.groupBy({
    by: ["category"],
    where: { financialMonthId },
    _sum: { amountCents: true },
  });

  for (const row of grouped) {
    totals[row.category as ExpenseCategory] = row._sum.amountCents ?? 0;
  }

  return totals;
}

/**
 * Builds the exact input shape calculateProfitAndLoss expects, merging the month's
 * direct fields (revenue/food cost/labor) with its aggregated vendor expense totals.
 * The calculation engine itself is untouched by the vendor-tracking change.
 */
export function buildFinancialMonthInput(
  month: { revenueCents: number; foodCostCents: number; laborCostCents: number },
  categoryTotals: Record<ExpenseCategory, number>,
): FinancialMonthInput {
  return {
    revenueCents: month.revenueCents,
    foodCostCents: month.foodCostCents,
    laborCostCents: month.laborCostCents,
    rentCents: categoryTotals.RENT,
    utilitiesCents: categoryTotals.UTILITIES,
    creditCardFeesCents: categoryTotals.CREDIT_CARD_FEES,
    deliveryFeesCents: categoryTotals.DELIVERY_FEES,
    insuranceCents: categoryTotals.INSURANCE,
    marketingCents: categoryTotals.MARKETING,
    repairsCents: categoryTotals.REPAIRS,
    otherExpensesCents: categoryTotals.OTHER,
  };
}

/** Convenience wrapper: aggregate + build in one call for a FinancialMonth record. */
export async function getFinancialMonthPLInput(month: {
  id: string;
  revenueCents: number;
  foodCostCents: number;
  laborCostCents: number;
}): Promise<FinancialMonthInput> {
  const totals = await aggregateExpensesByCategory(month.id);
  return buildFinancialMonthInput(month, totals);
}
