// Pure constants only — no `db` import, safe to import from Client Components
// (see expenseCategories.ts for the same reasoning).

export const LABOR_ROLES = ["KITCHEN", "FRONT_OF_HOUSE", "MANAGEMENT", "DELIVERY", "OTHER"] as const;

export type LaborRole = (typeof LABOR_ROLES)[number];
