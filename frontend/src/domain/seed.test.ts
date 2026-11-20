import assert from "node:assert/strict";
import test from "node:test";
import { filterDishes } from "@/domain/dishes";
import { buildSeed, emptyKitchen, stripSeededContent } from "@/domain/seed";
import type { Dish, ShoppingItem } from "@/domain/types";

test("un hogar nuevo arranca vacío y cocina para 4", () => {
  const empty = emptyKitchen();
  assert.deepEqual(empty.dishes, []);
  assert.deepEqual(empty.entries, []);
  assert.deepEqual(empty.lists, []);
  assert.equal(empty.cooksFor, 4);
});

test("la versión anterior pierde el ejemplo y conserva lo de la casa", () => {
  const seed = buildSeed("2026-11-20");
  const stripped = stripSeededContent(seed);
  assert.equal(stripped.dishes.length, 0);
  assert.equal(stripped.entries.length, 0);
  assert.equal(stripped.lists.length, 0);
  assert.equal(stripped.cooksFor, 4);

  const own: Dish = {
    ...seed.dishes[0],
    id: "11111111-1111-4111-8111-111111111111",
    title: "Pizza casera",
    description: "Los viernes, con mucha muzzarella",
  };
  assert.ok(seed.lists[0]);
  const yerba: ShoppingItem = {
    ...seed.lists[0].items[0],
    id: "22222222-2222-4222-8222-222222222222",
    name: "Yerba",
    origin: "MANUAL",
    generatedKey: null,
  };
  const mixed = stripSeededContent({
    ...seed,
    dishes: [...seed.dishes, own],
    entries: [
      ...seed.entries,
      {
        id: "33333333-3333-4333-8333-333333333333",
        dishId: own.id,
        date: "2026-11-20",
        mealType: "DINNER",
        servings: 3,
      },
    ],
    lists: seed.lists.map((list) => ({ ...list, items: [...list.items, yerba] })),
    cooksFor: 5,
  });
  assert.deepEqual(
    mixed.dishes.map((dish) => dish.title),
    ["Pizza casera"],
  );
  assert.equal(mixed.entries.length, 1);
  assert.equal(mixed.entries[0]?.dishId, own.id);
  assert.equal(mixed.entries[0]?.servings, 5);
  assert.equal(mixed.lists.length, 1);
  assert.deepEqual(
    mixed.lists[0]?.items.map((item) => item.name),
    ["Yerba"],
  );
  assert.equal(mixed.cooksFor, 5);
  assert.equal(
    filterDishes(mixed.dishes, { text: "muzzarella", category: "ALL" }).length,
    1,
  );
});
