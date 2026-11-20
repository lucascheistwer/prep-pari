import {
  formatAmount,
  formatCanonical,
  parseQuantity,
  scaleQuantity,
  toCanonical,
} from "@/domain/quantity";
import { foldText, normalizeIngredientName } from "@/domain/text";
import type { Dish, DishCategory, DishIngredient, IngredientDraft } from "@/domain/types";

export type DishFilter = {
  text: string;
  category: DishCategory | "ALL" | "FAVORITES";
};

export function dishStatusLabel(dish: Pick<Dish, "ingredients" | "ingredientsStatus">) {
  if (dish.ingredientsStatus === "PENDING") {
    return "Generando ingredientes";
  }
  if (dish.ingredientsStatus === "FAILED") {
    return "No se pudo completar";
  }
  if (dish.ingredients.length === 0) {
    return "Sin ingredientes";
  }
  if (dish.ingredients.some((ingredient) => ingredientNeedsReview(ingredient))) {
    return "Parcial";
  }
  return "Listo";
}

export function ingredientNeedsReview(
  ingredient: Pick<DishIngredient, "quantity" | "unit">,
) {
  if (ingredient.unit === "to_taste") {
    return false;
  }
  return ingredient.quantity == null || ingredient.unit == null;
}

export function filterDishes(dishes: Dish[], filter: DishFilter) {
  const query = foldText(filter.text);
  return dishes
    .filter((dish) => {
      if (filter.category === "FAVORITES" && !dish.favorite) {
        return false;
      }
      if (
        filter.category !== "ALL" &&
        filter.category !== "FAVORITES" &&
        dish.category !== filter.category
      ) {
        return false;
      }
      if (!query) {
        return true;
      }
      if (foldText(dish.title).includes(query)) {
        return true;
      }
      return dish.ingredients.some(
        (ingredient) =>
          ingredient.normalizedName.includes(query) ||
          foldText(ingredient.name).includes(query),
      );
    })
    .sort((a, b) => {
      if (a.favorite !== b.favorite) {
        return a.favorite ? -1 : 1;
      }
      return a.title.localeCompare(b.title, "es");
    });
}

export type ViewIngredient = {
  id: string;
  name: string;
  amount: string;
  estimated: boolean;
  needsReview: boolean;
};

export function scaleIngredientForView(
  ingredient: DishIngredient,
  baseServings: number,
  plannedServings: number,
): ViewIngredient {
  const estimated =
    ingredient.source === "AI_ESTIMATED" || ingredient.source === "AI_EXPLICIT";
  if (
    ingredient.unit === "to_taste" ||
    ingredient.quantity == null ||
    ingredient.unit == null
  ) {
    return {
      id: ingredient.id,
      name: ingredient.name,
      amount: formatAmount(ingredient.quantity, ingredient.unit),
      estimated,
      needsReview: ingredientNeedsReview(ingredient),
    };
  }
  const parsed = parseQuantity(ingredient.quantity);
  if (parsed == null) {
    return {
      id: ingredient.id,
      name: ingredient.name,
      amount: "Cantidad a definir",
      estimated,
      needsReview: true,
    };
  }
  const canonical = toCanonical(parsed, ingredient.unit);
  if (!canonical) {
    return {
      id: ingredient.id,
      name: ingredient.name,
      amount: "A gusto",
      estimated,
      needsReview: true,
    };
  }
  const scaled = scaleQuantity(canonical.quantity, baseServings, plannedServings);
  return {
    id: ingredient.id,
    name: ingredient.name,
    amount: formatCanonical(scaled, canonical.unit),
    estimated,
    needsReview: false,
  };
}

export function applyIngredientEdits(
  previous: DishIngredient[],
  drafts: IngredientDraft[],
) {
  return drafts
    .filter((draft) => draft.name.trim().length > 0)
    .map((draft) => {
      const prev = previous.find((ingredient) => ingredient.id === draft.id);
      const quantity = draft.unit === "to_taste" ? null : draft.quantity;
      const changed =
        !prev ||
        prev.name !== draft.name.trim() ||
        prev.quantity !== quantity ||
        prev.unit !== draft.unit ||
        prev.category !== draft.category ||
        prev.note !== draft.note;
      return {
        id: draft.id,
        name: draft.name.trim(),
        normalizedName: normalizeIngredientName(draft.name),
        quantity,
        unit: draft.unit,
        category: draft.category,
        source: changed ? ("USER_DEFINED" as const) : prev.source,
        note: draft.note,
      };
    });
}
