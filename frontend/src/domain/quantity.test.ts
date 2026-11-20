import assert from "node:assert/strict";
import test from "node:test";
import { scaleIngredientForView } from "@/domain/dishes";
import { formatYield, suggestYield } from "@/domain/recipes";
import {
  formatAmount,
  formatCanonical,
  parseQuantity,
  parseUnit,
  scaleQuantity,
} from "@/domain/quantity";
import type { DishIngredient } from "@/domain/types";

test("200 g para 4 porciones, planificadas 2, quedan en 100 g", () => {
  const quantity = parseQuantity("200");
  assert.ok(quantity);
  const scaled = scaleQuantity(quantity, 4, 2);
  assert.equal(formatCanonical(scaled, "g"), "100 g");
});

test("acepta coma decimal y alias de unidades", () => {
  assert.equal(parseQuantity("1,5")?.toString(), parseQuantity("1.5")?.toString());
  assert.equal(parseUnit("gramos"), "g");
  assert.equal(parseUnit("kilos"), "kg");
  assert.equal(parseUnit("litros"), "l");
  assert.equal(parseUnit("unidades"), "unit");
  assert.equal(parseUnit("cucharadas"), "tbsp");
  assert.equal(parseUnit("a gusto"), "to_taste");
  assert.equal(parseQuantity("-1"), null);
});

test("1,5 kg se muestra en kilos y no se convierte una taza a gramos", () => {
  const kg = parseQuantity("1.5");
  assert.ok(kg);
  assert.equal(formatCanonical(kg * BigInt(1000), "g"), "1,5 kg");
  assert.equal(formatAmount("2", "cup"), "2 tazas");
  assert.equal(formatAmount(null, null), "Cantidad a definir");
  assert.equal(formatAmount(null, "to_taste"), "A gusto");
});

test("el rinde se sugiere con la comida y el plan parte de la casa", () => {
  assert.equal(
    formatYield(suggestYield("Tarta de verduras")),
    "Rinde 1 tarta (~6 porciones)",
  );
  assert.equal(formatYield(suggestYield("Milanesas con puré")), "Rinde 4 porciones");
  assert.equal(formatYield(suggestYield("Fideos con tuco")), "Rinde 4 porciones");
  assert.equal(suggestYield("Tarta de verduras").baseServings, 6);
});

test("la lista escala con las porciones del plan sobre el rinde", () => {
  const quantity = parseQuantity("600");
  assert.ok(quantity);
  assert.equal(formatCanonical(scaleQuantity(quantity, 6, 2), "g"), "200 g");
  assert.equal(formatCanonical(scaleQuantity(quantity, 4, 4), "g"), "600 g");
});

test("la vista de la comida escala sin marcar la cantidad como confirmada", () => {
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
  const salt: DishIngredient = {
    id: "salt",
    name: "Sal",
    normalizedName: "sal",
    quantity: null,
    unit: "to_taste",
    category: "ALMACEN",
    source: "UNKNOWN",
    note: "A gusto",
  };
  const scaled = scaleIngredientForView(flour, 4, 2);
  assert.equal(scaled.amount, "100 g");
  assert.equal(scaled.estimated, true);
  const taste = scaleIngredientForView(salt, 4, 8);
  assert.equal(taste.amount, "A gusto");
  assert.equal(taste.needsReview, false);
});
