import { applyIngredientEdits } from "@/domain/dishes";
import { suggestIngredients, suggestYield } from "@/domain/recipes";
import { buildSeed } from "@/domain/seed";
import { buildRequirements, entriesForWeek, reconcileItems } from "@/domain/shopping";
import { normalizeIngredientName } from "@/domain/text";
import type {
  Dish,
  DishCategory,
  IngredientDraft,
  MealEntry,
  MealType,
  ShoppingCategory,
  ShoppingItem,
  ShoppingList,
  Snapshot,
  UnitCode,
} from "@/domain/types";
import { todayIso } from "@/domain/week";

const STORAGE_KEY = "preppari.kitchen.v1";

export type StoreResult<T = undefined> =
  { ok: true; value: T } | { ok: false; message: string; needsConfirmation?: boolean };

const listeners = new Set<() => void>();
const suggestTokens = new Map<string, number>();

let snapshot: Snapshot = buildSeed(todayIso());
const serverSnapshot = snapshot;
let hydrated = false;

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, snapshot }));
    } catch {
      // Si el navegador no puede guardar, la pantalla sigue con lo que está en memoria.
    }
  }
  listeners.forEach((listener) => listener());
}

function update(next: Snapshot) {
  snapshot = next;
  emit();
}

function replaceDish(dishes: Dish[], dish: Dish) {
  return dishes.map((item) => (item.id === dish.id ? dish : item));
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  hydrate();
  return snapshot;
}

export function getServerSnapshot() {
  return serverSnapshot;
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") {
    return;
  }
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      emit();
      return;
    }
    const parsed = parseStored(raw);
    if (!parsed) {
      emit();
      return;
    }
    snapshot = parsed;
    listeners.forEach((listener) => listener());
  } catch {
    emit();
  }
}

function parseStored(raw: string): Snapshot | null {
  const parsed = JSON.parse(raw) as { version?: number; snapshot?: Snapshot };
  if (parsed.version !== 1 || !parsed.snapshot) {
    return null;
  }
  const { dishes, entries, lists } = parsed.snapshot;
  if (!Array.isArray(dishes) || !Array.isArray(entries) || !Array.isArray(lists)) {
    return null;
  }
  if (
    dishes.some((dish) => !dish?.id || !dish.title || !Array.isArray(dish.ingredients))
  ) {
    return null;
  }
  const cooksFor = parsed.snapshot.cooksFor;
  return {
    ...parsed.snapshot,
    cooksFor: validServings(cooksFor) ? cooksFor : 4,
    dishes: dishes.map((dish) => ({
      ...dish,
      pieceCount: typeof dish.pieceCount === "number" ? dish.pieceCount : null,
      pieceName: typeof dish.pieceName === "string" ? dish.pieceName : null,
    })),
  };
}

function validServings(servings: number) {
  return Number.isInteger(servings) && servings >= 1 && servings <= 30;
}

function validTitle(title: string) {
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 80 ? trimmed : null;
}

export function createDish(input: {
  title: string;
  category: DishCategory;
  imageDataUrl: string | null;
  suggest: boolean;
}): StoreResult<string> {
  const title = validTitle(input.title);
  if (!title) {
    return { ok: false, message: "Escribí un nombre para la comida." };
  }
  const yieldSuggestion = suggestYield(title);
  const id = crypto.randomUUID();
  const dish: Dish = {
    id,
    title,
    category: input.category,
    baseServings: yieldSuggestion.baseServings,
    pieceCount: yieldSuggestion.pieceCount,
    pieceName: yieldSuggestion.pieceName,
    favorite: false,
    imageDataUrl: input.imageDataUrl,
    ingredientsStatus: "NOT_REQUESTED",
    imageStatus: input.imageDataUrl ? "READY" : "NOT_REQUESTED",
    ingredients: [],
  };
  update({ ...snapshot, dishes: [dish, ...snapshot.dishes] });
  if (input.suggest) {
    suggestDish(id, true);
  }
  return { ok: true, value: id };
}

export function updateDish(
  id: string,
  patch: Partial<
    Pick<
      Dish,
      | "title"
      | "category"
      | "baseServings"
      | "pieceCount"
      | "pieceName"
      | "favorite"
      | "imageDataUrl"
    >
  >,
): StoreResult {
  const dish = snapshot.dishes.find((item) => item.id === id);
  if (!dish) {
    return { ok: false, message: "No encontramos esa comida." };
  }
  const next = { ...dish };
  if (patch.title !== undefined) {
    const title = validTitle(patch.title);
    if (!title) {
      return { ok: false, message: "Escribí un nombre para la comida." };
    }
    next.title = title;
  }
  if (patch.category !== undefined) {
    next.category = patch.category;
  }
  if (patch.baseServings !== undefined) {
    if (!validServings(patch.baseServings)) {
      return { ok: false, message: "Las porciones van de 1 a 30." };
    }
    next.baseServings = patch.baseServings;
  }
  if (patch.pieceName !== undefined) {
    const piece = patch.pieceName?.trim() ?? "";
    next.pieceName = piece ? piece.slice(0, 40) : null;
    if (!next.pieceName) {
      next.pieceCount = null;
    }
  }
  if (patch.pieceCount != null && next.pieceName) {
    next.pieceCount = validServings(patch.pieceCount) ? patch.pieceCount : 1;
  }
  if (patch.favorite !== undefined) {
    next.favorite = patch.favorite;
  }
  if (patch.imageDataUrl !== undefined) {
    next.imageDataUrl = patch.imageDataUrl;
    next.imageStatus = patch.imageDataUrl ? "READY" : "NOT_REQUESTED";
  }
  update({ ...snapshot, dishes: replaceDish(snapshot.dishes, next) });
  return { ok: true, value: undefined };
}

export function deleteDish(id: string): StoreResult {
  if (snapshot.entries.some((entry) => entry.dishId === id)) {
    return { ok: false, message: "Está en el plan. Sacala de ahí antes." };
  }
  if (!snapshot.dishes.some((dish) => dish.id === id)) {
    return { ok: false, message: "No encontramos esa comida." };
  }
  suggestTokens.set(id, (suggestTokens.get(id) ?? 0) + 1);
  update({ ...snapshot, dishes: snapshot.dishes.filter((dish) => dish.id !== id) });
  return { ok: true, value: undefined };
}

export function saveIngredients(id: string, drafts: IngredientDraft[]): StoreResult {
  const dish = snapshot.dishes.find((item) => item.id === id);
  if (!dish) {
    return { ok: false, message: "No encontramos esa comida." };
  }
  if (drafts.length > 60) {
    return { ok: false, message: "Son demasiados ingredientes." };
  }
  suggestTokens.set(id, (suggestTokens.get(id) ?? 0) + 1);
  const ingredients = applyIngredientEdits(dish.ingredients, drafts);
  const next: Dish = {
    ...dish,
    ingredients,
    ingredientsStatus: ingredients.length === 0 ? "NOT_REQUESTED" : "READY",
  };
  update({ ...snapshot, dishes: replaceDish(snapshot.dishes, next) });
  return { ok: true, value: undefined };
}

export function suggestDish(id: string, confirmed: boolean): StoreResult {
  const dish = snapshot.dishes.find((item) => item.id === id);
  if (!dish) {
    return { ok: false, message: "No encontramos esa comida." };
  }
  const hasManual = dish.ingredients.some(
    (ingredient) => ingredient.source === "USER_DEFINED",
  );
  if (hasManual && !confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      message: "Hay ingredientes que corregiste. Si seguís, se mantienen.",
    };
  }
  const token = (suggestTokens.get(id) ?? 0) + 1;
  suggestTokens.set(id, token);
  update({
    ...snapshot,
    dishes: replaceDish(snapshot.dishes, { ...dish, ingredientsStatus: "PENDING" }),
  });
  globalThis.setTimeout(() => finishSuggest(id, token), 700);
  return { ok: true, value: undefined };
}

function finishSuggest(id: string, token: number) {
  if (suggestTokens.get(id) !== token) {
    return;
  }
  const dish = snapshot.dishes.find((item) => item.id === id);
  if (!dish || dish.ingredientsStatus !== "PENDING") {
    return;
  }
  const suggested = suggestIngredients(dish.title, dish.baseServings, () =>
    crypto.randomUUID(),
  );
  const manual = dish.ingredients.filter(
    (ingredient) => ingredient.source === "USER_DEFINED",
  );
  const manualNames = new Set(manual.map((ingredient) => ingredient.normalizedName));
  const ingredients = [
    ...manual,
    ...suggested.ingredients.filter(
      (ingredient) => !manualNames.has(ingredient.normalizedName),
    ),
  ];
  const category =
    dish.category === "OTROS" && suggested.category ? suggested.category : dish.category;
  update({
    ...snapshot,
    dishes: replaceDish(snapshot.dishes, {
      ...dish,
      category,
      ingredients,
      ingredientsStatus: "READY",
    }),
  });
}

export function setEntry(input: {
  date: string;
  mealType: MealType;
  dishId: string;
  servings: number;
}): StoreResult {
  if (!snapshot.dishes.some((dish) => dish.id === input.dishId)) {
    return { ok: false, message: "No encontramos esa comida." };
  }
  if (!validServings(input.servings)) {
    return { ok: false, message: "Las porciones van de 1 a 30." };
  }
  const existing = snapshot.entries.find(
    (entry) => entry.date === input.date && entry.mealType === input.mealType,
  );
  const next: MealEntry = existing
    ? { ...existing, dishId: input.dishId, servings: input.servings }
    : {
        id: crypto.randomUUID(),
        dishId: input.dishId,
        date: input.date,
        mealType: input.mealType,
        servings: input.servings,
      };
  const entries = existing
    ? snapshot.entries.map((entry) => (entry.id === existing.id ? next : entry))
    : [...snapshot.entries, next];
  update({ ...snapshot, entries });
  return { ok: true, value: undefined };
}

export function setCooksFor(cooksFor: number): StoreResult {
  if (!validServings(cooksFor)) {
    return { ok: false, message: "Las porciones van de 1 a 30." };
  }
  update({ ...snapshot, cooksFor });
  return { ok: true, value: undefined };
}

export function setServings(entryId: string, servings: number): StoreResult {
  if (!validServings(servings)) {
    return { ok: false, message: "Las porciones van de 1 a 30." };
  }
  const existing = snapshot.entries.find((entry) => entry.id === entryId);
  if (!existing) {
    return { ok: false, message: "Esa comida ya no está en el plan." };
  }
  update({
    ...snapshot,
    entries: snapshot.entries.map((entry) =>
      entry.id === entryId ? { ...entry, servings } : entry,
    ),
  });
  return { ok: true, value: undefined };
}

export function moveEntry(
  entryId: string,
  date: string,
  mealType: MealType,
): StoreResult {
  const existing = snapshot.entries.find((entry) => entry.id === entryId);
  if (!existing) {
    return { ok: false, message: "Esa comida ya no está en el plan." };
  }
  if (existing.date === date && existing.mealType === mealType) {
    return { ok: true, value: undefined };
  }
  const occupied = snapshot.entries.some(
    (entry) => entry.id !== entryId && entry.date === date && entry.mealType === mealType,
  );
  if (occupied) {
    return { ok: false, message: "Ese lugar ya tiene una comida." };
  }
  update({
    ...snapshot,
    entries: snapshot.entries.map((entry) =>
      entry.id === entryId ? { ...entry, date, mealType } : entry,
    ),
  });
  return { ok: true, value: undefined };
}

export function removeEntry(entryId: string) {
  update({
    ...snapshot,
    entries: snapshot.entries.filter((entry) => entry.id !== entryId),
  });
}

function listFor(weekStart: string): ShoppingList {
  return (
    snapshot.lists.find((list) => list.weekStart === weekStart) ?? {
      id: `list-${weekStart}`,
      weekStart,
      items: [],
      incompleteDishIds: [],
    }
  );
}

function saveList(list: ShoppingList) {
  const exists = snapshot.lists.some((item) => item.weekStart === list.weekStart);
  const lists = exists
    ? snapshot.lists.map((item) => (item.weekStart === list.weekStart ? list : item))
    : [...snapshot.lists, list];
  update({ ...snapshot, lists });
}

export function addManualItem(
  weekStart: string,
  input: {
    name: string;
    quantity: string | null;
    unit: UnitCode | null;
    category: ShoppingCategory;
  },
): StoreResult {
  const name = validTitle(input.name);
  if (!name) {
    return { ok: false, message: "Escribí qué hay que comprar." };
  }
  const list = listFor(weekStart);
  const item: ShoppingItem = {
    id: crypto.randomUUID(),
    name,
    normalizedName: normalizeIngredientName(name),
    quantity: input.unit === "to_taste" ? null : input.quantity,
    unit: input.unit,
    category: input.category,
    status: "PENDING",
    origin: "MANUAL",
    generatedKey: null,
    needsReview:
      input.unit !== "to_taste" && (input.quantity == null || input.unit == null),
    position: list.items.reduce((max, current) => Math.max(max, current.position), 0) + 1,
  };
  saveList({ ...list, items: [...list.items, item] });
  return { ok: true, value: undefined };
}

export function updateShoppingItem(
  weekStart: string,
  itemId: string,
  patch: {
    name: string;
    quantity: string | null;
    unit: UnitCode | null;
    category: ShoppingCategory;
  },
): StoreResult {
  const name = validTitle(patch.name);
  if (!name) {
    return { ok: false, message: "Escribí qué hay que comprar." };
  }
  const list = listFor(weekStart);
  if (!list.items.some((item) => item.id === itemId)) {
    return { ok: false, message: "Ese producto ya no está en la lista." };
  }
  saveList({
    ...list,
    items: list.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            name,
            normalizedName: normalizeIngredientName(name),
            quantity: patch.unit === "to_taste" ? null : patch.quantity,
            unit: patch.unit,
            category: patch.category,
            needsReview:
              patch.unit !== "to_taste" && (patch.quantity == null || patch.unit == null),
          }
        : item,
    ),
  });
  return { ok: true, value: undefined };
}

export function setItemStatus(weekStart: string, itemId: string, purchased: boolean) {
  const list = listFor(weekStart);
  saveList({
    ...list,
    items: list.items.map((item) =>
      item.id === itemId
        ? { ...item, status: purchased ? "PURCHASED" : "PENDING" }
        : item,
    ),
  });
}

export function removeShoppingItem(weekStart: string, itemId: string) {
  const list = listFor(weekStart);
  saveList({ ...list, items: list.items.filter((item) => item.id !== itemId) });
}

export function generateList(weekStart: string): StoreResult<{
  incompleteDishIds: string[];
  hadPlan: boolean;
}> {
  const weekEntries = entriesForWeek(snapshot.entries, weekStart);
  const { requirements, incompleteDishIds } = buildRequirements(
    snapshot.dishes,
    weekEntries,
  );
  const current = listFor(weekStart);
  const reconciled = reconcileItems(current.items, requirements, () =>
    crypto.randomUUID(),
  );
  saveList({
    ...current,
    items: reconciled.items,
    incompleteDishIds,
  });
  return {
    ok: true,
    value: { incompleteDishIds, hadPlan: weekEntries.length > 0 },
  };
}
