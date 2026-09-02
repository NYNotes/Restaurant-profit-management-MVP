import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { usableCostPerUnit } from "../src/lib/calculations/ingredient";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@jukai.nyc";
const DEMO_PASSWORD = "demo12345";

async function main() {
  const existing = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Demo user ${DEMO_EMAIL} already exists — skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await db.user.create({
    data: { email: DEMO_EMAIL, name: "Jukai Owner", passwordHash },
  });

  const organization = await db.organization.create({
    data: {
      name: "Jukai NY",
      members: { create: { userId: user.id, role: "OWNER" } },
      restaurants: {
        create: {
          name: "Jukai NY",
          settings: {
            create: {
              language: "en",
              currencyCode: "USD",
              measurementSystem: "US",
              targetFoodCostBp: 3000,
              foodCostWarningBp: 300,
              foodCostHighBp: 700,
            },
          },
        },
      },
    },
    include: { restaurants: true },
  });

  const restaurantId = organization.restaurants[0].id;

  // Demo ingredients from the brief (section 33)
  const seedIngredients = [
    { name: "Salmon", purchasePriceCents: 14500, purchaseQty: 10, purchaseUnit: "LB" as const, yieldBp: 8200 },
    { name: "Avocado", purchasePriceCents: 120, purchaseQty: 1, purchaseUnit: "EACH" as const, yieldBp: 10000 },
    { name: "Rice", purchasePriceCents: 3800, purchaseQty: 50, purchaseUnit: "LB" as const, yieldBp: 10000 },
    { name: "Wagyu", purchasePriceCents: 2850, purchaseQty: 1, purchaseUnit: "LB" as const, yieldBp: 10000 },
    { name: "Spicy Mayo", purchasePriceCents: 820, purchaseQty: 1, purchaseUnit: "L" as const, yieldBp: 10000 },
  ];

  for (const ing of seedIngredients) {
    const costPerUsableUnitCents = usableCostPerUnit({
      purchasePriceCents: ing.purchasePriceCents,
      purchaseQty: ing.purchaseQty,
      yieldBp: ing.yieldBp,
    });

    const ingredient = await db.ingredient.create({
      data: {
        restaurantId,
        name: ing.name,
        purchasePriceCents: ing.purchasePriceCents,
        purchaseQty: ing.purchaseQty,
        purchaseUnit: ing.purchaseUnit,
        usableQty: ing.purchaseQty * (ing.yieldBp / 10000),
        yieldBp: ing.yieldBp,
        costPerUsableUnitCents,
      },
    });

    await db.ingredientPriceHistory.create({
      data: {
        ingredientId: ingredient.id,
        purchasePriceCents: ing.purchasePriceCents,
        purchaseQty: ing.purchaseQty,
        purchaseUnit: ing.purchaseUnit,
        yieldBp: ing.yieldBp,
        costPerUsableUnitCents,
      },
    });
  }

  // Demo financial month from the brief (section 14 / 33). Rent/utilities/etc. are no
  // longer flat columns — they're vendor-tagged expense line items that sum up to the
  // same totals the brief specifies, demonstrating the per-vendor breakdown. Labor is
  // itemized by role the same way, also summing to the brief's total.
  const financialMonth = await db.financialMonth.create({
    data: {
      restaurantId,
      year: 2026,
      month: 7,
      revenueCents: 8452000,
      foodCostCents: 2468000,
      isClosed: true,
    },
  });

  await db.laborCostLineItem.createMany({
    data: [
      { financialMonthId: financialMonth.id, role: "KITCHEN", amountCents: 1600000 },
      { financialMonthId: financialMonth.id, role: "FRONT_OF_HOUSE", amountCents: 800000 },
      { financialMonthId: financialMonth.id, role: "MANAGEMENT", amountCents: 262400 },
    ],
  });

  const landlord = await db.vendor.create({ data: { restaurantId, name: "Midtown Realty Partners" } });
  const conEdison = await db.vendor.create({ data: { restaurantId, name: "Con Edison" } });
  const paymentProcessor = await db.vendor.create({ data: { restaurantId, name: "Square" } });

  await db.expenseLineItem.createMany({
    data: [
      { financialMonthId: financialMonth.id, category: "RENT", vendorId: landlord.id, amountCents: 950000 },
      { financialMonthId: financialMonth.id, category: "UTILITIES", vendorId: conEdison.id, amountCents: 214000 },
      { financialMonthId: financialMonth.id, category: "CREDIT_CARD_FEES", vendorId: paymentProcessor.id, amountCents: 231000 },
      { financialMonthId: financialMonth.id, category: "OTHER", vendorId: null, description: "Misc. supplies", amountCents: 742600 },
    ],
  });

  console.log("Seeded demo restaurant 'Jukai NY'.");
  console.log(`Log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
