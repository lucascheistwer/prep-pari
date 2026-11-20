import { normalizeIngredientName } from "@/domain/text";
import type {
  DishCategory,
  DishIngredient,
  IngredientSource,
  ShoppingCategory,
  UnitCode,
} from "@/domain/types";
import {
  parseQuantity,
  quantityToString,
  scaleQuantity,
  toCanonical,
} from "@/domain/quantity";

export type RecipeIngredient = {
  name: string;
  quantity: string | null;
  unit: UnitCode | null;
  category: ShoppingCategory;
  source: IngredientSource;
  note: string | null;
};

export type Recipe = {
  title: string;
  category: DishCategory;
  baseServings: number;
  pieceCount: number | null;
  pieceName: string | null;
  ingredients: RecipeIngredient[];
};

function ingredient(
  name: string,
  quantity: string | null,
  unit: UnitCode | null,
  category: ShoppingCategory,
  source: IngredientSource = "AI_ESTIMATED",
  note: string | null = null,
): RecipeIngredient {
  return { name, quantity, unit, category, source, note };
}

const taste = (name: string, category: ShoppingCategory): RecipeIngredient =>
  ingredient(name, null, "to_taste", category, "UNKNOWN", "A gusto");

export const RECIPES: Record<string, Recipe> = {
  "milanesas con pure": {
    title: "Milanesas con puré",
    category: "CARNES",
    baseServings: 4,
    pieceCount: null,
    pieceName: null,
    ingredients: [
      ingredient("Nalga", "500", "g", "CARNICERIA"),
      ingredient("Papa", "800", "g", "VERDULERIA"),
      ingredient("Huevo", "2", "unit", "LACTEOS_Y_HUEVOS"),
      ingredient("Pan rallado", "100", "g", "ALMACEN"),
      ingredient("Leche", "200", "ml", "LACTEOS_Y_HUEVOS"),
      ingredient("Aceite", "50", "ml", "ALMACEN"),
      taste("Sal", "ALMACEN"),
    ],
  },
  "tarta de verduras": {
    title: "Tarta de verduras",
    category: "TARTAS_Y_EMPANADAS",
    baseServings: 6,
    pieceCount: 1,
    pieceName: "tarta",
    ingredients: [
      ingredient("Tapas de tarta", "2", "unit", "PANADERIA"),
      ingredient("Acelga", "400", "g", "VERDULERIA"),
      ingredient("Huevo", "3", "unit", "LACTEOS_Y_HUEVOS"),
      ingredient("Cebolla", "1", "unit", "VERDULERIA"),
      ingredient("Morrón", "1", "unit", "VERDULERIA"),
      ingredient("Queso rallado", "100", "g", "LACTEOS_Y_HUEVOS"),
      taste("Sal", "ALMACEN"),
    ],
  },
  "noquis de papa": {
    title: "Ñoquis de papa",
    category: "PASTAS",
    baseServings: 6,
    pieceCount: 1,
    pieceName: "fuente",
    ingredients: [
      ingredient("Papa", "1", "kg", "VERDULERIA"),
      ingredient("Harina 0000", "300", "g", "ALMACEN"),
      ingredient("Huevo", "1", "unit", "LACTEOS_Y_HUEVOS"),
      taste("Sal", "ALMACEN"),
    ],
  },
  "pollo al horno con papas": {
    title: "Pollo al horno con papas",
    category: "POLLO",
    baseServings: 4,
    pieceCount: null,
    pieceName: null,
    ingredients: [
      ingredient("Pollo", "1.2", "kg", "CARNICERIA"),
      ingredient("Papa", "1", "kg", "VERDULERIA"),
      ingredient("Ajo", "3", "unit", "VERDULERIA"),
      ingredient("Aceite", "30", "ml", "ALMACEN"),
      taste("Romero", "ALMACEN"),
    ],
  },
  "ensalada completa": {
    title: "Ensalada completa",
    category: "ENSALADAS",
    baseServings: 2,
    pieceCount: null,
    pieceName: null,
    ingredients: [
      ingredient("Lechuga", "1", "unit", "VERDULERIA"),
      ingredient("Tomate", "2", "unit", "VERDULERIA"),
      ingredient("Zanahoria", "1", "unit", "VERDULERIA"),
      ingredient("Limón", "1", "unit", "VERDULERIA"),
      ingredient("Aceite", "15", "ml", "ALMACEN"),
    ],
  },
  "sopa de lentejas": {
    title: "Sopa de lentejas",
    category: "SOPAS_Y_GUISOS",
    baseServings: 4,
    pieceCount: 1,
    pieceName: "olla",
    ingredients: [
      ingredient("Lentejas", "300", "g", "ALMACEN"),
      ingredient("Zanahoria", "1", "unit", "VERDULERIA"),
      ingredient("Cebolla", "1", "unit", "VERDULERIA"),
      ingredient("Papa", "300", "g", "VERDULERIA"),
      ingredient("Chorizo colorado", "1", "unit", "CARNICERIA"),
      ingredient("Pimentón", "5", "g", "ALMACEN"),
    ],
  },
  "sandwich de milanesa": {
    title: "Sandwich de milanesa",
    category: "SANDWICHES",
    baseServings: 2,
    pieceCount: null,
    pieceName: null,
    ingredients: [
      ingredient("Pan", "2", "unit", "PANADERIA"),
      ingredient("Lechuga", "1", "unit", "VERDULERIA"),
      ingredient("Tomate", "1", "unit", "VERDULERIA"),
      ingredient("Milanesa", "2", "unit", "CARNICERIA"),
    ],
  },
};

const GENERIC: RecipeIngredient[] = [
  ingredient("Cebolla", "1", "unit", "VERDULERIA"),
  ingredient("Aceite", "30", "ml", "ALMACEN"),
  taste("Sal", "ALMACEN"),
];

function scaleRecipeQuantity(
  quantity: string | null,
  unit: UnitCode | null,
  fromServings: number,
  toServings: number,
) {
  if (
    quantity == null ||
    unit == null ||
    unit === "to_taste" ||
    fromServings === toServings
  ) {
    return quantity;
  }
  const parsed = parseQuantity(quantity);
  if (parsed == null) {
    return quantity;
  }
  const canonical = toCanonical(parsed, unit);
  if (!canonical || canonical.unit !== unit) {
    const scaled = scaleQuantity(parsed, fromServings, toServings);
    return quantityToString(scaled);
  }
  const scaled = scaleQuantity(parsed, fromServings, toServings);
  return quantityToString(scaled);
}

export function suggestIngredients(
  title: string,
  baseServings: number,
  idFor: (name: string, index: number) => string,
): { category: DishCategory | null; ingredients: DishIngredient[] } {
  const key = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  const recipe = RECIPES[key];
  const sourceIngredients = recipe?.ingredients ?? GENERIC;
  const fromServings = recipe?.baseServings ?? 4;
  const ingredients = sourceIngredients.map((item, index) => ({
    id: idFor(item.name, index),
    name: item.name,
    normalizedName: normalizeIngredientName(item.name),
    quantity: scaleRecipeQuantity(item.quantity, item.unit, fromServings, baseServings),
    unit: item.unit,
    category: item.category,
    source: item.source,
    note: item.note,
  }));
  return { category: recipe?.category ?? null, ingredients };
}

export type YieldSuggestion = {
  baseServings: number;
  pieceCount: number | null;
  pieceName: string | null;
};

export function suggestYield(title: string): YieldSuggestion {
  const key = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  const recipe = RECIPES[key];
  if (!recipe) {
    return { baseServings: 4, pieceCount: null, pieceName: null };
  }
  return {
    baseServings: recipe.baseServings,
    pieceCount: recipe.pieceCount,
    pieceName: recipe.pieceName,
  };
}

export function formatYield(dish: YieldSuggestion) {
  const portions =
    dish.baseServings === 1 ? "1 porción" : `${dish.baseServings} porciones`;
  const piece = dish.pieceName?.trim();
  if (!piece || !dish.pieceCount || dish.pieceCount < 1) {
    return `Rinde ${portions}`;
  }
  const name = dish.pieceCount === 1 || piece.endsWith("s") ? piece : `${piece}s`;
  return `Rinde ${dish.pieceCount} ${name} (~${portions})`;
}
