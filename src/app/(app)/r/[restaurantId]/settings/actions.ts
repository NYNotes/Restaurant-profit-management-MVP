"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRestaurantAccess } from "@/lib/auth/session";

const settingsSchema = z.object({
  restaurantName: z.string().trim().min(1, "Restaurant name is required"),
  language: z.enum(["en", "ja", "es"]),
  currencyCode: z.enum(["USD", "JPY", "EUR"]),
  measurementSystem: z.enum(["US", "METRIC"]),
  targetFoodCostPercent: z.coerce.number().min(1).max(100),
  foodCostWarningPercent: z.coerce.number().min(0).max(100),
  foodCostHighPercent: z.coerce.number().min(0).max(100),
});

export interface SettingsActionState {
  error?: string;
}

export async function updateSettingsAction(
  restaurantId: string,
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireRestaurantAccess(restaurantId);

  const parsed = settingsSchema.safeParse({
    restaurantName: formData.get("restaurantName"),
    language: formData.get("language"),
    currencyCode: formData.get("currencyCode"),
    measurementSystem: formData.get("measurementSystem"),
    targetFoodCostPercent: formData.get("targetFoodCostPercent"),
    foodCostWarningPercent: formData.get("foodCostWarningPercent"),
    foodCostHighPercent: formData.get("foodCostHighPercent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    restaurantName,
    language,
    currencyCode,
    measurementSystem,
    targetFoodCostPercent,
    foodCostWarningPercent,
    foodCostHighPercent,
  } = parsed.data;

  await db.restaurant.update({ where: { id: restaurantId }, data: { name: restaurantName } });

  await db.restaurantSettings.upsert({
    where: { restaurantId },
    create: {
      restaurantId,
      language,
      currencyCode,
      measurementSystem,
      targetFoodCostBp: Math.round(targetFoodCostPercent * 100),
      foodCostWarningBp: Math.round(foodCostWarningPercent * 100),
      foodCostHighBp: Math.round(foodCostHighPercent * 100),
    },
    update: {
      language,
      currencyCode,
      measurementSystem,
      targetFoodCostBp: Math.round(targetFoodCostPercent * 100),
      foodCostWarningBp: Math.round(foodCostWarningPercent * 100),
      foodCostHighBp: Math.round(foodCostHighPercent * 100),
    },
  });

  redirect(`/r/${restaurantId}/settings`);
}
