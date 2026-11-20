import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScaledIngredients } from "@/components/dishes/ScaledIngredients";
import { ShoppingGroups } from "@/components/shopping/ShoppingGroups";
import { buildSeed } from "@/domain/seed";
import type { DishIngredient } from "@/domain/types";

const flour: DishIngredient = {
  id: "flour",
  name: "Harina",
  normalizedName: "harina",
  quantity: "200",
  unit: "g",
  category: "ALMACEN",
  source: "AI_ESTIMATED",
  note: null,
};

test("la vista muestra la harina escalada y la lista agrupada", () => {
  const scaled = renderToStaticMarkup(
    <ScaledIngredients ingredients={[flour]} baseServings={4} servings={2} />,
  );
  assert.match(scaled, /Harina/);
  assert.match(scaled, /100 g/);
  assert.match(scaled, /Estimada/);

  const seed = buildSeed("2026-11-20");
  const list = seed.lists[0];
  assert.ok(list);
  const html = renderToStaticMarkup(<ShoppingGroups items={list.items} />);
  const produce = html.indexOf("Verdulería");
  const pantry = html.indexOf("Almacén");
  assert.ok(produce >= 0 && pantry > produce);
  assert.match(html, /3,5 kg/);
  assert.match(html, /Huevos/);
});
