"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

const setupSchema = z.object({
  restaurantName: z.string().trim().min(1, "Restaurant name is required"),
  language: z.enum(["en", "ja", "es"]),
  currencyCode: z.enum(["USD", "JPY", "EUR"]),
  measurementSystem: z.enum(["US", "METRIC"]),
  targetFoodCostPercent: z.coerce.number().min(1).max(100),
});

export interface SetupActionState {
  error?: string;
}

export async function createRestaurantAction(_prevState: SetupActionState, formData: FormData): Promise<SetupActionState> {
  const user = await requireUser();

  const parsed = setupSchema.safeParse({
    restaurantName: formData.get("restaurantName"),
    language: formData.get("language"),
    currencyCode: formData.get("currencyCode"),
    measurementSystem: formData.get("measurementSystem"),
    targetFoodCostPercent: formData.get("targetFoodCostPercent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { restaurantName, language, currencyCode, measurementSystem, targetFoodCostPercent } = parsed.data;

  const restaurant = await db.organization.create({
    data: {
      name: restaurantName,
      members: { create: { userId: user.id, role: "OWNER" } },
      restaurants: {
        create: {
          name: restaurantName,
          settings: {
            create: {
              language,
              currencyCode,
              measurementSystem,
              targetFoodCostBp: Math.round(targetFoodCostPercent * 100),
            },
          },
        },
      },
    },
    include: { restaurants: true },
  });

  redirect(`/r/${restaurant.restaurants[0].id}/dashboard`);
}
