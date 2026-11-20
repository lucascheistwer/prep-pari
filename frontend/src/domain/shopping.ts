import { SHOPPING_CATEGORY_LABELS } from "@/domain/labels";
import {
  parseQuantity,
  quantityToString,
  scaleQuantity,
  toCanonical,
} from "@/domain/quantity";
import { normalizeIngredientName } from "@/domain/text";
import { addDays } from "@/domain/week";
import type {
  Dish,
  MealEntry,
  ShoppingCategory,
  ShoppingItem,
  UnitCode,
} from "@/domain/types";

export type Requirement = {
  name: string;
  normalizedName: string;
  quantity: string | null;
  unit: UnitCode | null;
  category: ShoppingCategory;
  needsReview: boolean;
  generatedKey: string;
};

function requirementKey(
  normalizedName: string,
  unit: UnitCode | null,
  quantitative: boolean,
) {
  if (!quantitative) {
    return `${normalizedName}:${unit === "to_taste" ? "to_taste" : "unknown"}`;
  }
  return `${normalizedName}:${unit}`;
}

export function buildRequirements(dishes: Dish[], entries: MealEntry[]) {
  const byId = new Map(dishes.map((dish) => [dish.id, dish]));
  const incompleteDishIds: string[] = [];
  const grouped = new Map<string, Requirement & { milli: bigint | null }>();
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.mealType === b.mealType ? 0 : a.mealType === "LUNCH" ? -1 : 1;
  });

  for (const entry of sorted) {
    const dish = byId.get(entry.dishId);
    if (!dish) {
      continue;
    }
    if (dish.ingredients.length === 0) {
      if (!incompleteDishIds.includes(dish.id)) {
        incompleteDishIds.push(dish.id);
      }
      continue;
    }
    for (const ingredient of dish.ingredients) {
      const normalizedName =
        ingredient.normalizedName || normalizeIngredientName(ingredient.name);
      const qualitative =
        ingredient.unit === "to_taste" ||
        ingredient.quantity == null ||
        ingredient.unit == null;
      let milli: bigint | null = null;
      let unit: UnitCode | null = ingredient.unit === "to_taste" ? "to_taste" : null;
      if (!qualitative && ingredient.quantity && ingredient.unit) {
        const parsed = parseQuantity(ingredient.quantity);
        const canonical = parsed == null ? null : toCanonical(parsed, ingredient.unit);
        if (parsed != null && canonical) {
          milli = scaleQuantity(canonical.quantity, dish.baseServings, entry.servings);
          unit = canonical.unit;
        }
      }
      const key = requirementKey(normalizedName, unit, milli != null);
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, {
          name: ingredient.name,
          normalizedName,
          quantity: milli == null ? null : quantityToString(milli),
          unit:
            milli == null ? (ingredient.unit === "to_taste" ? "to_taste" : null) : unit,
          category: ingredient.category,
          needsReview: milli == null && ingredient.unit !== "to_taste",
          generatedKey: key,
          milli,
        });
        continue;
      }
      if (milli != null && current.milli != null) {
        current.milli += milli;
        current.quantity = quantityToString(current.milli);
      }
    }
  }

  const requirements: Requirement[] = [...grouped.values()].map((entry) => ({
    name: entry.name,
    normalizedName: entry.normalizedName,
    quantity: entry.quantity,
    unit: entry.unit,
    category: entry.category,
    needsReview: entry.needsReview,
    generatedKey: entry.generatedKey,
  }));
  return { requirements, incompleteDishIds };
}

export type ReconcileCounts = {
  created: number;
  updated: number;
  removed: number;
};

export function reconcileItems(
  existing: ShoppingItem[],
  requirements: Requirement[],
  newId: (key: string) => string,
): { items: ShoppingItem[]; counts: ReconcileCounts } {
  const manuals = existing.filter((item) => item.origin === "MANUAL");
  const generated = existing.filter((item) => item.origin === "GENERATED");
  const byKey = new Map(
    generated.flatMap((item) =>
      item.generatedKey ? [[item.generatedKey, item] as const] : [],
    ),
  );
  const seen = new Set<string>();
  const nextGenerated: ShoppingItem[] = [];
  let created = 0;
  let updated = 0;
  let removed = 0;

  requirements.forEach((requirement, index) => {
    seen.add(requirement.generatedKey);
    const previous = byKey.get(requirement.generatedKey);
    if (!previous) {
      created += 1;
      nextGenerated.push({
        id: newId(requirement.generatedKey),
        name: requirement.name,
        normalizedName: requirement.normalizedName,
        quantity: requirement.quantity,
        unit: requirement.unit,
        category: requirement.category,
        status: "PENDING",
        origin: "GENERATED",
        generatedKey: requirement.generatedKey,
        needsReview: requirement.needsReview,
        position: index,
      });
      return;
    }
    const sameAmount =
      previous.quantity === requirement.quantity && previous.unit === requirement.unit;
    if (!sameAmount) {
      updated += 1;
    }
    nextGenerated.push({
      ...previous,
      name: requirement.name,
      normalizedName: requirement.normalizedName,
      quantity: requirement.quantity,
      unit: requirement.unit,
      category: requirement.category,
      needsReview: requirement.needsReview,
      status: sameAmount ? previous.status : "PENDING",
      position: index,
    });
  });

  for (const previous of generated) {
    if (previous.generatedKey && !seen.has(previous.generatedKey)) {
      if (previous.status === "PURCHASED") {
        nextGenerated.push(previous);
      } else {
        removed += 1;
      }
    }
  }

  return {
    items: [...nextGenerated, ...manuals],
    counts: { created, updated, removed },
  };
}

export function entriesForWeek(entries: MealEntry[], weekStart: string) {
  const end = addDays(weekStart, 6);
  return entries.filter((entry) => entry.date >= weekStart && entry.date <= end);
}

export function groupShoppingItems(items: ShoppingItem[]) {
  return (Object.keys(SHOPPING_CATEGORY_LABELS) as ShoppingCategory[])
    .map((category) => ({
      category,
      label: SHOPPING_CATEGORY_LABELS[category],
      items: items
        .filter((item) => item.category === category)
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "PENDING" ? -1 : 1;
          }
          return a.position - b.position;
        }),
    }))
    .filter((group) => group.items.length > 0);
}

export function manualDuplicateIds(items: ShoppingItem[]) {
  const generatedNames = new Set(
    items
      .filter((item) => item.origin === "GENERATED")
      .map((item) => item.normalizedName),
  );
  return new Set(
    items
      .filter(
        (item) => item.origin === "MANUAL" && generatedNames.has(item.normalizedName),
      )
      .map((item) => item.id),
  );
}

export function shoppingProgress(items: ShoppingItem[]) {
  const total = items.length;
  const purchased = items.filter((item) => item.status === "PURCHASED").length;
  return {
    purchased,
    total,
    label: `${purchased} de ${total} comprados`,
  };
}
