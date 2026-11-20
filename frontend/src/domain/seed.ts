import { RECIPES, suggestIngredients } from "@/domain/recipes";
import { buildRequirements, entriesForWeek, reconcileItems } from "@/domain/shopping";
import { normalizeIngredientName } from "@/domain/text";
import type {
  Dish,
  MealEntry,
  ShoppingItem,
  ShoppingList,
  Snapshot,
} from "@/domain/types";
import { addDays, weekStartIso } from "@/domain/week";

export const SEEDED_DISH_IDS = new Set([
  "dish-milanesas-con-pure",
  "dish-tarta-de-verduras",
  "dish-noquis-de-papa",
  "dish-pollo-al-horno-con-papas",
  "dish-ensalada-completa",
  "dish-sopa-de-lentejas",
  "dish-sandwich-de-milanesa",
  "dish-arroz-con-atun",
]);

export const SEEDED_ENTRY_IDS = new Set([
  "entry-mon-lunch",
  "entry-mon-dinner",
  "entry-tue-lunch",
  "entry-wed-dinner",
  "entry-thu-lunch",
  "entry-thu-dinner",
  "entry-fri-lunch",
  "entry-fri-dinner",
  "entry-sat-dinner",
  "entry-sun-lunch",
]);

export const SEEDED_ITEM_IDS = new Set(["manual-papel", "manual-huevo"]);

const CONFIRMED = new Set([
  "milanesas con pure",
  "pollo al horno con papas",
  "ensalada completa",
  "sandwich de milanesa",
]);

function dishFromRecipe(key: string, favorite: boolean): Dish {
  const recipe = RECIPES[key];
  if (!recipe) {
    throw new Error(key);
  }
  const suggested = suggestIngredients(
    key,
    recipe.baseServings,
    (_name, index) => `ing-${key.replace(/\s+/g, "-")}-${index}`,
  );
  const confirmed = CONFIRMED.has(key);
  return {
    id: `dish-${key.replace(/\s+/g, "-")}`,
    title: titleFromKey(key),
    description: null,
    category: suggested.category ?? recipe.category,
    baseServings: recipe.baseServings,
    pieceCount: recipe.pieceCount,
    pieceName: recipe.pieceName,
    favorite,
    imageDataUrl: null,
    ingredientsStatus: "READY",
    imageStatus: "NOT_REQUESTED",
    ingredients: suggested.ingredients.map((ingredient) =>
      confirmed ? { ...ingredient, source: "USER_DEFINED" as const } : ingredient,
    ),
  };
}

function titleFromKey(key: string) {
  const titles: Record<string, string> = {
    "milanesas con pure": "Milanesas con puré",
    "tarta de verduras": "Tarta de verduras",
    "noquis de papa": "Ñoquis de papa",
    "pollo al horno con papas": "Pollo al horno con papas",
    "ensalada completa": "Ensalada completa",
    "sopa de lentejas": "Sopa de lentejas",
    "sandwich de milanesa": "Sandwich de milanesa",
  };
  return titles[key] ?? key;
}

function emptyDish(): Dish {
  return {
    id: "dish-arroz-con-atun",
    title: "Arroz con atún",
    description: null,
    category: "ARROCES_Y_CEREALES",
    baseServings: 2,
    pieceCount: null,
    pieceName: null,
    favorite: false,
    imageDataUrl: null,
    ingredientsStatus: "NOT_REQUESTED",
    imageStatus: "NOT_REQUESTED",
    ingredients: [],
  };
}

export function buildSeed(today: string): Snapshot {
  const dishes = [
    dishFromRecipe("milanesas con pure", true),
    dishFromRecipe("tarta de verduras", true),
    dishFromRecipe("noquis de papa", false),
    dishFromRecipe("pollo al horno con papas", true),
    dishFromRecipe("ensalada completa", false),
    dishFromRecipe("sopa de lentejas", false),
    dishFromRecipe("sandwich de milanesa", false),
    emptyDish(),
  ];
  const start = weekStartIso(today);
  const day = (offset: number) => addDays(start, offset);
  const entries = [
    {
      id: "entry-mon-lunch",
      dishId: "dish-milanesas-con-pure",
      date: day(0),
      mealType: "LUNCH" as const,
      servings: 4,
    },
    {
      id: "entry-mon-dinner",
      dishId: "dish-ensalada-completa",
      date: day(0),
      mealType: "DINNER" as const,
      servings: 2,
    },
    {
      id: "entry-tue-lunch",
      dishId: "dish-tarta-de-verduras",
      date: day(1),
      mealType: "LUNCH" as const,
      servings: 4,
    },
    {
      id: "entry-wed-dinner",
      dishId: "dish-pollo-al-horno-con-papas",
      date: day(2),
      mealType: "DINNER" as const,
      servings: 4,
    },
    {
      id: "entry-thu-lunch",
      dishId: "dish-noquis-de-papa",
      date: day(3),
      mealType: "LUNCH" as const,
      servings: 6,
    },
    {
      id: "entry-thu-dinner",
      dishId: "dish-arroz-con-atun",
      date: day(3),
      mealType: "DINNER" as const,
      servings: 2,
    },
    {
      id: "entry-fri-lunch",
      dishId: "dish-tarta-de-verduras",
      date: day(4),
      mealType: "LUNCH" as const,
      servings: 4,
    },
    {
      id: "entry-fri-dinner",
      dishId: "dish-milanesas-con-pure",
      date: day(4),
      mealType: "DINNER" as const,
      servings: 2,
    },
    {
      id: "entry-sat-dinner",
      dishId: "dish-ensalada-completa",
      date: day(5),
      mealType: "DINNER" as const,
      servings: 2,
    },
    {
      id: "entry-sun-lunch",
      dishId: "dish-sopa-de-lentejas",
      date: day(6),
      mealType: "LUNCH" as const,
      servings: 4,
    },
  ];
  const weekEntries = entriesForWeek(entries, start);
  const { requirements, incompleteDishIds } = buildRequirements(dishes, weekEntries);
  const reconciled = reconcileItems(
    existingManuals(),
    requirements,
    (key) => `gen-${key.replace(/[^a-z0-9]+/gi, "-")}`,
  );
  const items = reconciled.items.map((item) =>
    item.generatedKey === "pan rallado:g"
      ? { ...item, status: "PURCHASED" as const }
      : item,
  );
  const list: ShoppingList = {
    id: `list-${start}`,
    weekStart: start,
    items,
    incompleteDishIds,
  };
  return { dishes, entries, lists: [list], cooksFor: 4 };
}

export function emptyKitchen(): Snapshot {
  return { dishes: [], entries: [], lists: [], cooksFor: 4 };
}

export function stripSeededContent(snapshot: Snapshot): Snapshot {
  const dishes = (snapshot.dishes ?? []).filter(
    (dish) => dish && !SEEDED_DISH_IDS.has(dish.id),
  );
  const dishIds = new Set(dishes.map((dish) => dish.id));
  const cooksFor =
    Number.isInteger(snapshot.cooksFor) &&
    snapshot.cooksFor >= 1 &&
    snapshot.cooksFor <= 30
      ? snapshot.cooksFor
      : 4;
  const entries = ((snapshot.entries ?? []) as MealEntry[])
    .filter(
      (entry) => entry && !SEEDED_ENTRY_IDS.has(entry.id) && dishIds.has(entry.dishId),
    )
    .map((entry) => ({ ...entry, servings: cooksFor }));
  const lists = (snapshot.lists ?? [])
    .map((list) => ({
      ...list,
      incompleteDishIds: (list.incompleteDishIds ?? []).filter((id) => dishIds.has(id)),
      items: (list.items ?? []).filter(
        (item) => item && !SEEDED_ITEM_IDS.has(item.id) && !item.id.startsWith("gen-"),
      ),
    }))
    .filter((list) => list.items.length > 0);
  if (dishes.length > 0) {
    return { dishes, entries, lists, cooksFor };
  }
  const manuals = lists
    .map((list) => ({
      ...list,
      incompleteDishIds: [],
      items: list.items.filter((item) => item.origin === "MANUAL"),
    }))
    .filter((list) => list.items.length > 0);
  return { dishes: [], entries: [], lists: manuals, cooksFor };
}

function existingManuals(): ShoppingItem[] {
  return [
    manual("manual-papel", "Papel higiénico", "4", "unit", "LIMPIEZA_Y_HOGAR", 0),
    manual("manual-huevo", "Huevos", "6", "unit", "LACTEOS_Y_HUEVOS", 1),
  ];
}

function manual(
  id: string,
  name: string,
  quantity: string,
  unit: ShoppingItem["unit"],
  category: ShoppingItem["category"],
  position: number,
): ShoppingItem {
  return {
    id,
    name,
    normalizedName: normalizeIngredientName(name),
    quantity,
    unit,
    category,
    status: "PENDING",
    origin: "MANUAL",
    generatedKey: null,
    needsReview: false,
    position,
  };
}
