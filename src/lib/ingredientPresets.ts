// Curated, not exhaustive — a quick-pick list so common ingredients don't need to be
// typed by hand. Client-safe: pure data, no `db` import (see expenseCategories.ts for
// the same reasoning).

export interface LocalizedName {
  en: string;
  ja: string;
  es: string;
}

export interface IngredientPresetCategory {
  key: string;
  label: LocalizedName;
  items: LocalizedName[];
}

export const INGREDIENT_PRESET_CATEGORIES: IngredientPresetCategory[] = [
  {
    key: "vegetables",
    label: { en: "Vegetables", ja: "野菜", es: "Verduras" },
    items: [
      { en: "Onion", ja: "玉ねぎ", es: "Cebolla" },
      { en: "Garlic", ja: "にんにく", es: "Ajo" },
      { en: "Tomato", ja: "トマト", es: "Tomate" },
      { en: "Carrot", ja: "にんじん", es: "Zanahoria" },
      { en: "Potato", ja: "じゃがいも", es: "Papa" },
      { en: "Cabbage", ja: "キャベツ", es: "Repollo" },
      { en: "Lettuce", ja: "レタス", es: "Lechuga" },
      { en: "Bell Pepper", ja: "ピーマン", es: "Pimiento" },
      { en: "Cucumber", ja: "きゅうり", es: "Pepino" },
      { en: "Spinach", ja: "ほうれん草", es: "Espinaca" },
      { en: "Mushroom", ja: "きのこ", es: "Champiñón" },
      { en: "Scallion", ja: "ねぎ", es: "Cebolleta" },
      { en: "Ginger", ja: "生姜", es: "Jengibre" },
    ],
  },
  {
    key: "fruits",
    label: { en: "Fruits", ja: "果物", es: "Frutas" },
    items: [
      { en: "Lemon", ja: "レモン", es: "Limón" },
      { en: "Lime", ja: "ライム", es: "Lima" },
      { en: "Orange", ja: "オレンジ", es: "Naranja" },
      { en: "Apple", ja: "りんご", es: "Manzana" },
      { en: "Avocado", ja: "アボカド", es: "Aguacate" },
      { en: "Banana", ja: "バナナ", es: "Plátano" },
      { en: "Strawberry", ja: "いちご", es: "Fresa" },
    ],
  },
  {
    key: "meat",
    label: { en: "Meat", ja: "肉", es: "Carne" },
    items: [
      { en: "Beef", ja: "牛肉", es: "Res" },
      { en: "Wagyu", ja: "和牛", es: "Wagyu" },
      { en: "Ground Beef", ja: "牛ひき肉", es: "Carne molida de res" },
      { en: "Pork", ja: "豚肉", es: "Cerdo" },
      { en: "Bacon", ja: "ベーコン", es: "Tocino" },
      { en: "Lamb", ja: "ラム肉", es: "Cordero" },
      { en: "Chicken Breast", ja: "鶏むね肉", es: "Pechuga de pollo" },
      { en: "Chicken Thigh", ja: "鶏もも肉", es: "Muslo de pollo" },
      { en: "Duck", ja: "鴨肉", es: "Pato" },
    ],
  },
  {
    key: "seafood",
    label: { en: "Seafood", ja: "魚介類", es: "Mariscos" },
    items: [
      { en: "Salmon", ja: "サーモン", es: "Salmón" },
      { en: "Tuna", ja: "マグロ", es: "Atún" },
      { en: "Yellowtail", ja: "ぶり・はまち", es: "Hamachi" },
      { en: "Sea Bream", ja: "鯛", es: "Besugo" },
      { en: "Eel", ja: "うなぎ", es: "Anguila" },
      { en: "Shrimp", ja: "えび", es: "Camarón" },
      { en: "Squid", ja: "いか", es: "Calamar" },
      { en: "Octopus", ja: "たこ", es: "Pulpo" },
      { en: "Scallop", ja: "ホタテ", es: "Vieira" },
      { en: "Crab", ja: "かに", es: "Cangrejo" },
    ],
  },
  {
    key: "dairyEggs",
    label: { en: "Dairy & Eggs", ja: "乳製品・卵", es: "Lácteos y Huevos" },
    items: [
      { en: "Egg", ja: "卵", es: "Huevo" },
      { en: "Milk", ja: "牛乳", es: "Leche" },
      { en: "Butter", ja: "バター", es: "Mantequilla" },
      { en: "Heavy Cream", ja: "生クリーム", es: "Crema para batir" },
      { en: "Cheese", ja: "チーズ", es: "Queso" },
      { en: "Mozzarella", ja: "モッツァレラ", es: "Mozzarella" },
      { en: "Parmesan", ja: "パルメザン", es: "Parmesano" },
      { en: "Yogurt", ja: "ヨーグルト", es: "Yogur" },
    ],
  },
  {
    key: "grainsStarches",
    label: { en: "Grains & Starches", ja: "穀物・でんぷん", es: "Granos y Almidones" },
    items: [
      { en: "Rice", ja: "米", es: "Arroz" },
      { en: "Sushi Rice", ja: "寿司米", es: "Arroz para sushi" },
      { en: "Flour", ja: "小麦粉", es: "Harina" },
      { en: "Panko", ja: "パン粉", es: "Panko" },
      { en: "Potato Starch", ja: "片栗粉", es: "Almidón de papa" },
      { en: "Pasta", ja: "パスタ", es: "Pasta" },
      { en: "Bread", ja: "パン", es: "Pan" },
      { en: "Noodles", ja: "麺", es: "Fideos" },
    ],
  },
  {
    key: "saucesCondiments",
    label: { en: "Sauces & Condiments", ja: "ソース・調味料", es: "Salsas y Condimentos" },
    items: [
      { en: "Soy Sauce", ja: "醤油", es: "Salsa de soya" },
      { en: "Mayonnaise", ja: "マヨネーズ", es: "Mayonesa" },
      { en: "Sriracha", ja: "スリラチャ", es: "Sriracha" },
      { en: "Ponzu", ja: "ポン酢", es: "Ponzu" },
      { en: "Mirin", ja: "みりん", es: "Mirin" },
      { en: "Rice Vinegar", ja: "米酢", es: "Vinagre de arroz" },
      { en: "Sesame Oil", ja: "ごま油", es: "Aceite de sésamo" },
      { en: "Wasabi", ja: "わさび", es: "Wasabi" },
      { en: "Ketchup", ja: "ケチャップ", es: "Kétchup" },
      { en: "Mustard", ja: "マスタード", es: "Mostaza" },
    ],
  },
  {
    key: "spicesSeasonings",
    label: { en: "Spices & Seasonings", ja: "スパイス・香辛料", es: "Especias y Condimentos" },
    items: [
      { en: "Salt", ja: "塩", es: "Sal" },
      { en: "Black Pepper", ja: "黒胡椒", es: "Pimienta negra" },
      { en: "Sugar", ja: "砂糖", es: "Azúcar" },
      { en: "Sesame Seeds", ja: "ごま", es: "Semillas de sésamo" },
      { en: "Chili Flakes", ja: "唐辛子", es: "Hojuelas de chile" },
      { en: "Cumin", ja: "クミン", es: "Comino" },
      { en: "Paprika", ja: "パプリカ", es: "Paprika" },
    ],
  },
  {
    key: "beverages",
    label: { en: "Beverages", ja: "飲料", es: "Bebidas" },
    items: [
      { en: "Sake", ja: "日本酒", es: "Sake" },
      { en: "Cooking Wine", ja: "料理酒", es: "Vino de cocina" },
      { en: "Beer", ja: "ビール", es: "Cerveza" },
      { en: "Green Tea", ja: "緑茶", es: "Té verde" },
    ],
  },
];
