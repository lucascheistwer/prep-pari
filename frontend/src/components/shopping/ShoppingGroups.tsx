import { formatAmount } from "@/domain/quantity";
import { groupShoppingItems, manualDuplicateIds } from "@/domain/shopping";
import type { ShoppingItem } from "@/domain/types";
import type { ReactNode } from "react";

export function ShoppingGroups({
  items,
  renderItem,
}: {
  items: ShoppingItem[];
  renderItem?: (item: ShoppingItem, duplicate: boolean) => ReactNode;
}) {
  const groups = groupShoppingItems(items);
  const duplicates = manualDuplicateIds(items);
  if (groups.length === 0) {
    return null;
  }
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.category} aria-labelledby={`cat-${group.category}`}>
          <h2
            id={`cat-${group.category}`}
            className="mb-2 font-display text-xl text-text"
          >
            {group.label}
          </h2>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <li key={item.id}>
                {renderItem ? (
                  renderItem(item, duplicates.has(item.id))
                ) : (
                  <span>
                    {item.name} {formatAmount(item.quantity, item.unit)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
