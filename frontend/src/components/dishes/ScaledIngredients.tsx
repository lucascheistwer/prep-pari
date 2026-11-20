import { scaleIngredientForView } from "@/domain/dishes";
import type { DishIngredient } from "@/domain/types";

export function ScaledIngredients({
  ingredients,
  baseServings,
  servings,
}: {
  ingredients: DishIngredient[];
  baseServings: number;
  servings: number;
}) {
  if (ingredients.length === 0) {
    return (
      <p className="text-sm text-text-muted">A esta comida le faltan ingredientes.</p>
    );
  }
  const rows = ingredients.map((ingredient) =>
    scaleIngredientForView(ingredient, baseServings, servings),
  );
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex min-h-11 items-center justify-between gap-3 py-2"
        >
          <span className="text-sm text-text">
            {row.name}
            {row.estimated ? (
              <span className="ml-2 inline-flex rounded-full bg-brand-accent px-2 py-0.5 text-xs font-semibold text-text">
                Estimada
              </span>
            ) : null}
          </span>
          <span className="shrink-0 text-sm font-semibold text-text">{row.amount}</span>
        </li>
      ))}
    </ul>
  );
}
