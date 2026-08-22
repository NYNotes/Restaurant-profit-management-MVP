import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/**
 * Verifies the current user belongs to the organization that owns `restaurantId`
 * before any restaurant-scoped data is read or written. Every server action/route
 * that touches restaurant data must call this first — see section 31 (security).
 */
export async function requireRestaurantAccess(restaurantId: string) {
  const user = await requireUser();

  const membership = await db.organizationMember.findFirst({
    where: {
      userId: user.id,
      organization: { restaurants: { some: { id: restaurantId } } },
    },
  });

  if (!membership) redirect("/restaurants");

  return { user, role: membership.role };
}

/** The first restaurant the current user has access to — used for the MVP's single-restaurant flow. */
export async function getCurrentRestaurant() {
  const user = await requireUser();

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: { include: { restaurants: { include: { settings: true } } } } },
  });

  return membership?.organization.restaurants[0] ?? null;
}
