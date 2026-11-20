import type { DishCategory, MealType, ShoppingCategory, UnitCode } from "@/domain/types";

export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  PASTAS: "Pastas",
  TARTAS_Y_EMPANADAS: "Tartas y empanadas",
  CARNES: "Carnes",
  POLLO: "Pollo",
  PESCADOS: "Pescados",
  ENSALADAS: "Ensaladas",
  VERDURAS: "Verduras",
  ARROCES_Y_CEREALES: "Arroces y cereales",
  SOPAS_Y_GUISOS: "Sopas y guisos",
  SANDWICHES: "Sandwiches",
  OTROS: "Otros",
};

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  VERDULERIA: "Verdulería",
  CARNICERIA: "Carnicería",
  PESCADERIA: "Pescadería",
  LACTEOS_Y_HUEVOS: "Lácteos y huevos",
  ALMACEN: "Almacén",
  PANADERIA: "Panadería",
  CONGELADOS: "Congelados",
  BEBIDAS: "Bebidas",
  LIMPIEZA_Y_HOGAR: "Limpieza y hogar",
  OTROS: "Otros",
};

export const UNIT_LABELS: Record<UnitCode, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  unit: "unidades",
  tbsp: "cucharadas",
  tsp: "cucharaditas",
  cup: "tazas",
  to_taste: "a gusto",
};

export function mealLabel(mealType: MealType) {
  return mealType === "LUNCH" ? "Almuerzo" : "Cena";
}
