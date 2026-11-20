export const DISH_CATEGORIES = [
  "PASTAS",
  "TARTAS_Y_EMPANADAS",
  "CARNES",
  "POLLO",
  "PESCADOS",
  "ENSALADAS",
  "VERDURAS",
  "ARROCES_Y_CEREALES",
  "SOPAS_Y_GUISOS",
  "SANDWICHES",
  "OTROS",
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];

export const SHOPPING_CATEGORIES = [
  "VERDULERIA",
  "CARNICERIA",
  "PESCADERIA",
  "LACTEOS_Y_HUEVOS",
  "ALMACEN",
  "PANADERIA",
  "CONGELADOS",
  "BEBIDAS",
  "LIMPIEZA_Y_HOGAR",
  "OTROS",
] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

export const UNIT_CODES = [
  "g",
  "kg",
  "ml",
  "l",
  "unit",
  "tbsp",
  "tsp",
  "cup",
  "to_taste",
] as const;

export type UnitCode = (typeof UNIT_CODES)[number];

export type IngredientSource =
  "AI_ESTIMATED" | "AI_EXPLICIT" | "USER_DEFINED" | "UNKNOWN";

export type EnrichmentStatus = "NOT_REQUESTED" | "PENDING" | "READY" | "FAILED";

export type MealType = "LUNCH" | "DINNER";

export type ItemOrigin = "MANUAL" | "GENERATED";

export type ItemStatus = "PENDING" | "PURCHASED";

export type DishIngredient = {
  id: string;
  name: string;
  normalizedName: string;
  quantity: string | null;
  unit: UnitCode | null;
  category: ShoppingCategory;
  source: IngredientSource;
  note: string | null;
};

export type Dish = {
  id: string;
  title: string;
  category: DishCategory;
  baseServings: number;
  favorite: boolean;
  imageDataUrl: string | null;
  ingredientsStatus: EnrichmentStatus;
  imageStatus: EnrichmentStatus;
  ingredients: DishIngredient[];
};

export type MealEntry = {
  id: string;
  dishId: string;
  date: string;
  mealType: MealType;
  servings: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  normalizedName: string;
  quantity: string | null;
  unit: UnitCode | null;
  category: ShoppingCategory;
  status: ItemStatus;
  origin: ItemOrigin;
  generatedKey: string | null;
  needsReview: boolean;
  position: number;
};

export type ShoppingList = {
  id: string;
  weekStart: string;
  items: ShoppingItem[];
  incompleteDishIds: string[];
};

export type Snapshot = {
  dishes: Dish[];
  entries: MealEntry[];
  lists: ShoppingList[];
};

export type IngredientDraft = {
  id: string;
  name: string;
  quantity: string | null;
  unit: UnitCode | null;
  category: ShoppingCategory;
  note: string | null;
};
