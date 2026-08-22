-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "Restaurant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "measurementSystem" TEXT NOT NULL DEFAULT 'US',
    "targetFoodCostBp" INTEGER NOT NULL DEFAULT 3000,
    "foodCostWarningBp" INTEGER NOT NULL DEFAULT 300,
    "foodCostHighBp" INTEGER NOT NULL DEFAULT 700,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RestaurantSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "Vendor_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngredientCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "IngredientCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "vendorId" TEXT,
    "purchasePriceCents" INTEGER NOT NULL,
    "purchaseQty" REAL NOT NULL,
    "purchaseUnit" TEXT NOT NULL,
    "usableQty" REAL NOT NULL,
    "yieldBp" INTEGER NOT NULL,
    "costPerUsableUnitCents" REAL NOT NULL,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ingredient_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ingredient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IngredientCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ingredient_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngredientPriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingredientId" TEXT NOT NULL,
    "purchasePriceCents" INTEGER NOT NULL,
    "purchaseQty" REAL NOT NULL,
    "purchaseUnit" TEXT NOT NULL,
    "yieldBp" INTEGER NOT NULL,
    "costPerUsableUnitCents" REAL NOT NULL,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngredientPriceHistory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "RecipeCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "yieldQty" REAL NOT NULL,
    "yieldUnit" TEXT NOT NULL,
    "portionSize" REAL,
    "portionCount" REAL,
    "isSubRecipe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RecipeCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "componentRecipeId" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RecipeComponent_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeComponent_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecipeComponent_componentRecipeId_fkey" FOREIGN KEY ("componentRecipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "recipeId" TEXT,
    "sellingPriceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MenuItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuItemMonthlyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuItemId" TEXT NOT NULL,
    "financialMonthId" TEXT NOT NULL,
    "unitsSold" INTEGER NOT NULL,
    "sellingPriceCentsSnap" INTEGER NOT NULL,
    "foodCostCentsSnap" INTEGER NOT NULL,
    CONSTRAINT "MenuItemMonthlyStat_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuItemMonthlyStat_financialMonthId_fkey" FOREIGN KEY ("financialMonthId") REFERENCES "FinancialMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "foodCostCents" INTEGER NOT NULL DEFAULT 0,
    "laborCostCents" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialMonth_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financialMonthId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendorId" TEXT,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseLineItem_financialMonthId_fkey" FOREIGN KEY ("financialMonthId") REFERENCES "FinancialMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpenseLineItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettings_restaurantId_key" ON "RestaurantSettings"("restaurantId");

-- CreateIndex
CREATE INDEX "Vendor_restaurantId_idx" ON "Vendor"("restaurantId");

-- CreateIndex
CREATE INDEX "IngredientCategory_restaurantId_idx" ON "IngredientCategory"("restaurantId");

-- CreateIndex
CREATE INDEX "Ingredient_restaurantId_idx" ON "Ingredient"("restaurantId");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_ingredientId_effectiveDate_idx" ON "IngredientPriceHistory"("ingredientId", "effectiveDate");

-- CreateIndex
CREATE INDEX "RecipeCategory_restaurantId_idx" ON "RecipeCategory"("restaurantId");

-- CreateIndex
CREATE INDEX "Recipe_restaurantId_idx" ON "Recipe"("restaurantId");

-- CreateIndex
CREATE INDEX "RecipeComponent_recipeId_idx" ON "RecipeComponent"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeComponent_ingredientId_idx" ON "RecipeComponent"("ingredientId");

-- CreateIndex
CREATE INDEX "RecipeComponent_componentRecipeId_idx" ON "RecipeComponent"("componentRecipeId");

-- CreateIndex
CREATE INDEX "MenuCategory_restaurantId_idx" ON "MenuCategory"("restaurantId");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");

-- CreateIndex
CREATE INDEX "MenuItemMonthlyStat_financialMonthId_idx" ON "MenuItemMonthlyStat"("financialMonthId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemMonthlyStat_menuItemId_financialMonthId_key" ON "MenuItemMonthlyStat"("menuItemId", "financialMonthId");

-- CreateIndex
CREATE INDEX "FinancialMonth_restaurantId_idx" ON "FinancialMonth"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialMonth_restaurantId_year_month_key" ON "FinancialMonth"("restaurantId", "year", "month");

-- CreateIndex
CREATE INDEX "ExpenseLineItem_financialMonthId_idx" ON "ExpenseLineItem"("financialMonthId");

-- CreateIndex
CREATE INDEX "ExpenseLineItem_vendorId_idx" ON "ExpenseLineItem"("vendorId");
