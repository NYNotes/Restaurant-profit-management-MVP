"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { getOrCreateFinancialMonth } from "@/lib/financialMonth";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";

function dollarsToCents(value: FormDataEntryValue | null): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

const yearMonthSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export interface FinancialMonthActionState {
  error?: string;
}

/** Revenue, food cost, and labor aren't vendor-billed — they stay as simple direct entries. */
export async function saveCoreFinancialsAction(
  restaurantId: string,
  _prevState: FinancialMonthActionState,
  formData: FormData,
): Promise<FinancialMonthActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = yearMonthSchema.safeParse({ year: formData.get("year"), month: formData.get("month") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { year, month } = parsed.data;

  const data = {
    revenueCents: dollarsToCents(formData.get("revenue")),
    foodCostCents: dollarsToCents(formData.get("foodCost")),
    laborCostCents: dollarsToCents(formData.get("laborCost")),
  };

  await db.financialMonth.upsert({
    where: { restaurantId_year_month: { restaurantId, year, month } },
    create: { restaurantId, year, month, ...data },
    update: data,
  });

  redirect(`/r/${restaurantId}/profit-loss?year=${year}&month=${month}`);
}

async function findOrCreateVendor(restaurantId: string, name: string | undefined) {
  if (!name) return null;
  const existing = await db.vendor.findFirst({ where: { restaurantId, name } });
  if (existing) return existing.id;
  const created = await db.vendor.create({ data: { restaurantId, name } });
  return created.id;
}

const expenseLineItemSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  category: z.enum(EXPENSE_CATEGORIES),
  vendorName: z.string().trim().optional(),
  description: z.string().trim().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export interface ExpenseLineItemActionState {
  error?: string;
}

export async function addExpenseLineItemAction(
  restaurantId: string,
  _prevState: ExpenseLineItemActionState,
  formData: FormData,
): Promise<ExpenseLineItemActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = expenseLineItemSchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    category: formData.get("category"),
    vendorName: formData.get("vendorName") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { year, month, category, vendorName, description, amount } = parsed.data;

  const financialMonth = await getOrCreateFinancialMonth(restaurantId, year, month);
  const vendorId = await findOrCreateVendor(restaurantId, vendorName);

  await db.expenseLineItem.create({
    data: {
      financialMonthId: financialMonth.id,
      category,
      vendorId,
      description: description ?? null,
      amountCents: Math.round(amount * 100),
    },
  });

  redirect(`/r/${restaurantId}/profit-loss?year=${year}&month=${month}`);
}

export async function removeExpenseLineItemAction(
  restaurantId: string,
  lineItemId: string,
  year: number,
  month: number,
): Promise<void> {
  await requireRestaurantAccess(restaurantId);

  const item = await db.expenseLineItem.findFirst({
    where: { id: lineItemId, financialMonth: { restaurantId } },
  });
  if (item) {
    await db.expenseLineItem.delete({ where: { id: lineItemId } });
  }

  redirect(`/r/${restaurantId}/profit-loss?year=${year}&month=${month}`);
}
