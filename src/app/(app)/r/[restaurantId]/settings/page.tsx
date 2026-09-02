import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { bpToPercentString } from "@/lib/calculations/money";
import { SettingsForm } from "@/components/SettingsForm";
import { updateSettingsAction } from "./actions";

export default async function SettingsPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  const restaurant = await db.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    include: { settings: true },
  });
  const settings = restaurant.settings;
  const boundAction = updateSettingsAction.bind(null, restaurantId);
  const t = await getTranslations({ locale: settings?.language ?? "en", namespace: "settings" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

      <SettingsForm
        action={boundAction}
        defaults={{
          restaurantName: restaurant.name,
          language: settings?.language ?? "en",
          currencyCode: settings?.currencyCode ?? "USD",
          measurementSystem: settings?.measurementSystem ?? "US",
          targetFoodCostPercent: bpToPercentString(settings?.targetFoodCostBp ?? 3000, 1),
          foodCostWarningPercent: bpToPercentString(settings?.foodCostWarningBp ?? 300, 1),
          foodCostHighPercent: bpToPercentString(settings?.foodCostHighBp ?? 700, 1),
        }}
      />
    </div>
  );
}
