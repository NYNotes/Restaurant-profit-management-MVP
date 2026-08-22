// Pure constants only — no `db` import. This file is safe to import from Client
// Components (e.g. ExpenseLineItemForm); lib/expenses.ts (server-only aggregation
// logic) imports these from here rather than the other way around.

export const EXPENSE_CATEGORIES = [
  "RENT",
  "UTILITIES",
  "CREDIT_CARD_FEES",
  "DELIVERY_FEES",
  "INSURANCE",
  "MARKETING",
  "REPAIRS",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  CREDIT_CARD_FEES: "Credit Card Fees",
  DELIVERY_FEES: "Delivery Platform Fees",
  INSURANCE: "Insurance",
  MARKETING: "Marketing",
  REPAIRS: "Repairs",
  OTHER: "Other Expenses",
};
