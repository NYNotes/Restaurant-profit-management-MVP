import { db } from "@/lib/db";

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Parses `?year=&month=` search params into a valid {year, month}, falling back to
 * `fallback` for anything missing, non-numeric, or out of range. Pages that read these
 * params (P&L, Reports) must go through this rather than a bare Number(...) — an
 * untrusted string (hand-edited URL, stale bookmark, NaN) reaching a Prisma Int
 * argument throws PrismaClientValidationError and takes down the whole page.
 */
export function parseYearMonthParam(
  sp: { year?: string; month?: string },
  fallback: { year: number; month: number },
): { year: number; month: number } {
  const year = Number(sp.year);
  const month = Number(sp.month);
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100;
  const validMonth = Number.isInteger(month) && month >= 1 && month <= 12;

  return {
    year: validYear ? year : fallback.year,
    month: validMonth ? month : fallback.month,
  };
}

/**
 * A given month's FinancialMonth row, created on first access with all dollar
 * fields at 0. Menu item unit-sold entries and expense line items both need a
 * FinancialMonth to attach to — this is the single place that get-or-creates one.
 */
export async function getOrCreateFinancialMonth(restaurantId: string, year: number, month: number) {
  const existing = await db.financialMonth.findUnique({
    where: { restaurantId_year_month: { restaurantId, year, month } },
  });
  if (existing) return existing;

  return db.financialMonth.create({ data: { restaurantId, year, month } });
}

/** Convenience wrapper for the common "this month" case. */
export async function getOrCreateCurrentFinancialMonth(restaurantId: string) {
  const { year, month } = currentYearMonth();
  return getOrCreateFinancialMonth(restaurantId, year, month);
}
