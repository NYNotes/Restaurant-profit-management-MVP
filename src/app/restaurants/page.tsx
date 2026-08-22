import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function RestaurantsPage() {
  const user = await requireUser();

  const memberships = await db.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: { include: { restaurants: true } } },
  });

  const restaurants = memberships.flatMap((m) => m.organization.restaurants);

  if (restaurants.length === 0) {
    redirect("/restaurants/new");
  }

  if (restaurants.length === 1) {
    redirect(`/r/${restaurants[0].id}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Your restaurants</h1>
      <ul className="mt-6 space-y-3">
        {restaurants.map((r) => (
          <li key={r.id}>
            <Link
              href={`/r/${r.id}/dashboard`}
              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-400"
            >
              {r.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
