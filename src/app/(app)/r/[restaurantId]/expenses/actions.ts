"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { getOrCreateFinancialMonth } from "@/lib/financialMonth";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";

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

  redirect(`/r/${restaurantId}/expenses?year=${year}&month=${month}`);
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

  redirect(`/r/${restaurantId}/expenses?year=${year}&month=${month}`);
}
