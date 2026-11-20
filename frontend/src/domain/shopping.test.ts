import assert from "node:assert/strict";
import test from "node:test";
import { dishStatusLabel, filterDishes } from "@/domain/dishes";
import { buildSeed } from "@/domain/seed";
import {
  buildRequirements,
  groupShoppingItems,
  manualDuplicateIds,
  reconcileItems,
  shoppingProgress,
} from "@/domain/shopping";
import { normalizeIngredientName } from "@/domain/text";
import type { Dish, DishIngredient, ShoppingItem } from "@/domain/types";
import { weekStartIso } from "@/domain/week";

function ingredient(
  name: string,
  quantity: string | null,
  unit: DishIngredient["unit"],
  category: DishIngredient["category"] = "VERDULERIA",
): DishIngredient {
  return {
    id: name,
    name,
    normalizedName: normalizeIngredientName(name),
    quantity,
    unit,
    category,
    source: "USER_DEFINED",
    note: null,
  };
}

function dish(id: string, baseServings: number, ingredients: DishIngredient[]): Dish {
  return {
    id,
    title: id,
    description: null,
    category: "OTROS",
    baseServings,
    pieceCount: null,
    pieceName: null,
    favorite: false,
    imageDataUrl: null,
    ingredientsStatus: ingredients.length ? "READY" : "NOT_REQUESTED",
    imageStatus: "NOT_REQUESTED",
    ingredients,
  };
}

test("normaliza plurales del catálogo y no junta cebolla con cebolla de verdeo", () => {
  assert.equal(normalizeIngredientName("Papas"), "papa");
  assert.equal(normalizeIngredientName("Espinacas"), "espinaca");
  assert.equal(normalizeIngredientName("ricota"), "ricota");
  assert.equal(normalizeIngredientName("ricotas"), "ricotas");
  assert.equal(normalizeIngredientName("Cebolla"), "cebolla");
  assert.equal(normalizeIngredientName("Cebolla de verdeo"), "cebolla de verdeo");
  assert.equal(normalizeIngredientName("Cebollas de verdeo"), "cebolla de verdeo");
  assert.notEqual(
    normalizeIngredientName("Cebolla"),
    normalizeIngredientName("Cebolla de verdeo"),
  );
});

test("suma 400 g y 200 g de espinaca y convierte kg con g", () => {
  const monday = dish("lunes", 4, [ingredient("Espinaca", "400", "g")]);
  const wednesday = dish("miercoles", 4, [ingredient("Espinacas", "200", "g")]);
  const potatoes = dish("papas", 4, [
    ingredient("Papa", "1", "kg"),
    ingredient("Papa", "500", "g"),
  ]);
  const oil = dish("aceite", 1, [
    ingredient("Aceite", "1", "l", "ALMACEN"),
    ingredient("Aceite", "250", "ml", "ALMACEN"),
  ]);
  const mixed = dish("mix", 1, [
    ingredient("Harina", "100", "g", "ALMACEN"),
    ingredient("Harina", "1", "cup", "ALMACEN"),
    ingredient("Sal", null, "to_taste", "ALMACEN"),
    ingredient("Pimienta", null, null, "ALMACEN"),
  ]);
  const { requirements, incompleteDishIds } = buildRequirements(
    [monday, wednesday, potatoes, oil, mixed, dish("vacio", 2, [])],
    [
      { id: "1", dishId: "lunes", date: "2026-11-16", mealType: "LUNCH", servings: 4 },
      {
        id: "2",
        dishId: "miercoles",
        date: "2026-11-18",
        mealType: "LUNCH",
        servings: 4,
      },
      { id: "3", dishId: "papas", date: "2026-11-17", mealType: "DINNER", servings: 4 },
      { id: "4", dishId: "aceite", date: "2026-11-17", mealType: "LUNCH", servings: 1 },
      { id: "5", dishId: "mix", date: "2026-11-19", mealType: "LUNCH", servings: 1 },
      { id: "6", dishId: "vacio", date: "2026-11-19", mealType: "DINNER", servings: 2 },
    ],
  );
  const byKey = new Map(requirements.map((item) => [item.generatedKey, item]));
  assert.equal(byKey.get("espinaca:g")?.quantity, "600");
  assert.equal(byKey.get("papa:g")?.quantity, "1500");
  assert.equal(byKey.get("aceite:ml")?.quantity, "1250");
  assert.ok(byKey.get("harina:g"));
  assert.ok(byKey.get("harina:cup"));
  assert.notEqual(byKey.get("harina:g")?.quantity, byKey.get("harina:cup")?.quantity);
  assert.equal(byKey.get("sal:to_taste")?.needsReview, false);
  assert.equal(byKey.get("pimienta:unknown")?.needsReview, true);
  assert.deepEqual(incompleteDishIds, ["vacio"]);
});

test("la semana arranca el lunes", () => {
  assert.equal(weekStartIso("2026-11-20"), "2026-11-16");
  assert.equal(weekStartIso("2026-11-16"), "2026-11-16");
  assert.equal(weekStartIso("2026-11-22"), "2026-11-16");
  assert.equal(weekStartIso("2026-11-15"), "2026-11-09");
});

function item(
  partial: Partial<ShoppingItem> & Pick<ShoppingItem, "id" | "origin">,
): ShoppingItem {
  return {
    name: "Papa",
    normalizedName: "papa",
    quantity: "100",
    unit: "g",
    category: "VERDULERIA",
    status: "PENDING",
    generatedKey: partial.origin === "GENERATED" ? "papa:g" : null,
    needsReview: false,
    position: 0,
    ...partial,
  };
}

test("reconciliar conserva manuales, el comprado y vuelve a pendiente si cambia la cantidad", () => {
  const existing = [
    item({
      id: "gen-papa",
      origin: "GENERATED",
      status: "PURCHASED",
      quantity: "600",
      generatedKey: "papa:g",
    }),
    item({
      id: "gen-aceite",
      origin: "GENERATED",
      name: "Aceite",
      normalizedName: "aceite",
      quantity: "50",
      unit: "ml",
      category: "ALMACEN",
      status: "PENDING",
      generatedKey: "aceite:ml",
    }),
    item({
      id: "gen-viejo",
      origin: "GENERATED",
      name: "Pan",
      normalizedName: "pan",
      quantity: "1",
      unit: "unit",
      category: "PANADERIA",
      status: "PENDING",
      generatedKey: "pan:unit",
    }),
    item({
      id: "gen-comprado",
      origin: "GENERATED",
      name: "Queso",
      normalizedName: "queso",
      quantity: "200",
      unit: "g",
      category: "LACTEOS_Y_HUEVOS",
      status: "PURCHASED",
      generatedKey: "queso:g",
    }),
    item({
      id: "manual-papel",
      origin: "MANUAL",
      name: "Papel higiénico",
      normalizedName: "papel higienico",
      quantity: "4",
      unit: "unit",
      category: "LIMPIEZA_Y_HOGAR",
      generatedKey: null,
    }),
  ];
  const first = reconcileItems(
    existing,
    [
      {
        name: "Papa",
        normalizedName: "papa",
        quantity: "600",
        unit: "g",
        category: "VERDULERIA",
        needsReview: false,
        generatedKey: "papa:g",
      },
      {
        name: "Aceite",
        normalizedName: "aceite",
        quantity: "80",
        unit: "ml",
        category: "ALMACEN",
        needsReview: false,
        generatedKey: "aceite:ml",
      },
    ],
    (key) => `new-${key}`,
  );
  const again = reconcileItems(
    first.items,
    [
      {
        name: "Papa",
        normalizedName: "papa",
        quantity: "600",
        unit: "g",
        category: "VERDULERIA",
        needsReview: false,
        generatedKey: "papa:g",
      },
      {
        name: "Aceite",
        normalizedName: "aceite",
        quantity: "80",
        unit: "ml",
        category: "ALMACEN",
        needsReview: false,
        generatedKey: "aceite:ml",
      },
    ],
    (key) => `newer-${key}`,
  );

  const papa = first.items.find((entry) => entry.generatedKey === "papa:g");
  const aceite = first.items.find((entry) => entry.generatedKey === "aceite:ml");
  assert.equal(papa?.status, "PURCHASED");
  assert.equal(aceite?.status, "PENDING");
  assert.equal(aceite?.quantity, "80");
  assert.equal(
    first.items.some((entry) => entry.id === "manual-papel"),
    true,
  );
  assert.equal(
    first.items.some((entry) => entry.generatedKey === "pan:unit"),
    false,
  );
  assert.equal(
    first.items.some(
      (entry) => entry.generatedKey === "queso:g" && entry.status === "PURCHASED",
    ),
    true,
  );
  assert.equal(first.counts.removed, 1);
  assert.equal(again.counts.created, 0);
  assert.equal(again.items.filter((entry) => entry.generatedKey === "papa:g").length, 1);
  assert.equal(again.items.filter((entry) => entry.origin === "MANUAL").length, 1);
});

test("la lista de la semana agrupa por categoría y advierte el manual repetido", () => {
  const seed = buildSeed("2026-11-20");
  const list = seed.lists[0];
  assert.ok(list);
  assert.equal(list.weekStart, "2026-11-16");
  assert.equal(list.incompleteDishIds.includes("dish-arroz-con-atun"), true);
  const papa = list.items.find((entry) => entry.generatedKey === "papa:g");
  assert.equal(papa?.quantity, "3500");
  const groups = groupShoppingItems(list.items);
  assert.deepEqual(
    groups.map((group) => group.label),
    [...new Set(groups.map((group) => group.label))],
  );
  assert.equal(groups[0]?.label, "Verdulería");
  const duplicates = manualDuplicateIds(list.items);
  assert.equal(duplicates.has("manual-huevo"), true);
  assert.equal(duplicates.has("manual-papel"), false);
  const purchased = list.items.find((entry) => entry.generatedKey === "pan rallado:g");
  assert.equal(purchased?.status, "PURCHASED");
  const second = reconcileItems(
    list.items,
    buildRequirements(
      seed.dishes,
      seed.entries.filter(
        (entry) => entry.date >= "2026-11-16" && entry.date <= "2026-11-22",
      ),
    ).requirements,
    () => "should-not-create",
  );
  assert.equal(
    second.items.find((entry) => entry.generatedKey === "pan rallado:g")?.status,
    "PURCHASED",
  );
  assert.equal(
    second.items.some((entry) => entry.id === "manual-papel"),
    true,
  );
  assert.equal(second.counts.created, 0);
  const progress = shoppingProgress(list.items);
  assert.match(progress.label, /^\d+ de \d+ comprados$/);
  assert.equal(progress.purchased >= 1, true);
});

test("buscar por ingrediente y el estado de una comida sin ingredientes", () => {
  const seed = buildSeed("2026-11-20");
  const byPotato = filterDishes(seed.dishes, { text: "papa", category: "ALL" });
  assert.equal(
    byPotato.some((dish) => dish.title === "Milanesas con puré"),
    true,
  );
  assert.equal(
    byPotato.some((dish) => dish.title === "Sandwich de milanesa"),
    false,
  );
  const empty = seed.dishes.find((dish) => dish.title === "Arroz con atún");
  assert.ok(empty);
  assert.equal(dishStatusLabel(empty), "Sin ingredientes");
  const favorites = filterDishes(seed.dishes, { text: "", category: "FAVORITES" });
  assert.equal(
    favorites.every((dish) => dish.favorite),
    true,
  );
});
