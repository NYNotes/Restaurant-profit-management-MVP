"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { getOrCreateFinancialMonth } from "@/lib/financialMonth";
import { LABOR_ROLES } from "@/lib/laborRoles";

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

/** Revenue and food cost aren't vendor-billed or itemized — they stay as simple direct entries. */
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
  };

  await db.financialMonth.upsert({
    where: { restaurantId_year_month: { restaurantId, year, month } },
    create: { restaurantId, year, month, ...data },
    update: data,
  });

  redirect(`/r/${restaurantId}/profit-loss?year=${year}&month=${month}`);
}

const laborLineItemSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  role: z.enum(LABOR_ROLES),
  employeeName: z.string().trim().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export interface LaborCostLineItemActionState {
  error?: string;
}

export async function addLaborCostLineItemAction(
  restaurantId: string,
  _prevState: LaborCostLineItemActionState,
  formData: FormData,
): Promise<LaborCostLineItemActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = laborLineItemSchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    role: formData.get("role"),
    employeeName: formData.get("employeeName") || undefined,
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { year, month, role, employeeName, amount } = parsed.data;

  const financialMonth = await getOrCreateFinancialMonth(restaurantId, year, month);

  await db.laborCostLineItem.create({
    data: {
      financialMonthId: financialMonth.id,
      role,
      employeeName: employeeName ?? null,
      amountCents: Math.round(amount * 100),
    },
  });

  redirect(`/r/${restaurantId}/profit-loss?year=${year}&month=${month}`);
}

export async function removeLaborCostLineItemAction(
  restaurantId: string,
  lineItemId: string,
  year: number,
  month: number,
): Promise<void> {
  await requireRestaurantAccess(restaurantId);

  const item = await db.laborCostLineItem.findFirst({
    where: { id: lineItemId, financialMonth: { restaurantId } },
  });
  if (item) {
    await db.laborCostLineItem.delete({ where: { id: lineItemId } });
  }

  redirect(`/r/${restaurantId}/profit-loss?year=${year}&month=${month}`);
}
