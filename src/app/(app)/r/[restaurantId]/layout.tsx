import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRestaurantAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { DESKTOP_NAV, MOBILE_NAV } from "@/components/nav-config";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const { user } = await requireRestaurantAccess(restaurantId);

  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId }, include: { settings: true } });
  if (!restaurant) notFound();

  const locale = restaurant.settings?.language ?? "en";
  const t = await getTranslations({ locale, namespace: "nav" });

  const navLabels: Record<string, string> = {};
  for (const item of [...DESKTOP_NAV, ...MOBILE_NAV]) {
    navLabels[item.labelKey] = t(item.labelKey);
  }

  return (
    <AppShell
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      restaurantLabel={t("restaurantLabel")}
      userName={user.name ?? user.email ?? ""}
      navLabels={navLabels}
    >
      {children}
    </AppShell>
  );
}
