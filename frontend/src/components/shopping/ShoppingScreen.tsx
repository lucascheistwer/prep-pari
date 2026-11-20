"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingGroups } from "@/components/shopping/ShoppingGroups";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  Card,
  EmptyState,
  Field,
  Notice,
  SelectInput,
  TextInput,
} from "@/components/ui/kit";
import { useKitchen } from "@/data/kitchen-context";
import {
  addManualItem,
  generateList,
  removeShoppingItem,
  setItemStatus,
  updateShoppingItem,
} from "@/data/kitchen-store";
import { SHOPPING_CATEGORY_LABELS, UNIT_LABELS } from "@/domain/labels";
import { formatAmount } from "@/domain/quantity";
import { shoppingProgress } from "@/domain/shopping";
import {
  SHOPPING_CATEGORIES,
  UNIT_CODES,
  type ShoppingCategory,
  type ShoppingItem,
  type UnitCode,
} from "@/domain/types";
import { addDays, todayIso, weekRangeLabel, weekStartIso } from "@/domain/week";

export function ShoppingScreen() {
  const snapshot = useKitchen();
  const [start, setStart] = useState(() => weekStartIso(todayIso()));
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const list = snapshot.lists.find((item) => item.weekStart === start);
  const items = list?.items ?? [];
  const progress = items.length > 0 ? shoppingProgress(items) : null;
  const incomplete = (list?.incompleteDishIds ?? [])
    .map((id) => snapshot.dishes.find((dish) => dish.id === id))
    .filter((dish) => dish != null);
  const hasGenerated = items.some((item) => item.origin === "GENERATED");

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="font-display text-3xl text-text">Compras</h1>
        <p className="mt-1 text-sm text-text-muted">
          La lista de la casa, para esta semana.
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Semana anterior"
          className="grid size-11 place-items-center rounded-card border border-border bg-surface"
          onClick={() => {
            setStart(addDays(start, -7));
            setNote(null);
          }}
        >
          <Icon name="chevronLeft" />
        </button>
        <p className="text-sm font-semibold">{weekRangeLabel(start)}</p>
        <button
          type="button"
          aria-label="Semana siguiente"
          className="grid size-11 place-items-center rounded-card border border-border bg-surface"
          onClick={() => {
            setStart(addDays(start, 7));
            setNote(null);
          }}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      {progress ? (
        <div>
          <p className="font-display text-2xl text-text" aria-live="polite">
            {progress.label}
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-success"
              style={{
                width: `${Math.round((progress.purchased / progress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const result = generateList(start);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setError(null);
            setNote(
              result.value.hadPlan
                ? "Lista actualizada. Lo que agregaste a mano sigue ahí."
                : "No hay comidas en el plan. Lo que agregaste a mano sigue en la lista.",
            );
          }}
        >
          {hasGenerated ? "Actualizar desde el plan" : "Generar lista"}
        </Button>
        <p className="text-sm text-text-muted">
          Lo que agregues a mano se queda al actualizar.
        </p>
      </div>
      {note ? <Notice tone="info">{note}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {incomplete.length > 0 ? (
        <Notice tone="warning">
          <p>Falta completar ingredientes en:</p>
          <ul className="mt-2 space-y-1">
            {incomplete.map((dish) => (
              <li key={dish.id}>
                <Link href={`/comidas/${dish.id}`} className="font-semibold underline">
                  {dish.title}
                </Link>
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Nada en la lista"
          text="Generala desde el plan o agregá algo que haga falta."
        />
      ) : (
        <ShoppingGroups
          items={items}
          renderItem={(item, duplicate) => (
            <ItemRow
              item={item}
              duplicate={duplicate}
              editing={editing === item.id}
              onEdit={() => setEditing(editing === item.id ? null : item.id)}
              onToggle={() => setItemStatus(start, item.id, item.status !== "PURCHASED")}
              onRemove={() => removeShoppingItem(start, item.id)}
              onSave={(patch) => {
                const result = updateShoppingItem(start, item.id, patch);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setEditing(null);
                setError(null);
              }}
            />
          )}
        />
      )}

      <AddItem
        onAdd={(input) => {
          const result = addManualItem(start, input);
          if (!result.ok) {
            setError(result.message);
            return false;
          }
          setError(null);
          return true;
        }}
      />
    </div>
  );
}

function ItemRow({
  item,
  duplicate,
  editing,
  onEdit,
  onToggle,
  onRemove,
  onSave,
}: {
  item: ShoppingItem;
  duplicate: boolean;
  editing: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
  onSave: (patch: {
    name: string;
    quantity: string | null;
    unit: UnitCode | null;
    category: ShoppingCategory;
  }) => void;
}) {
  const bought = item.status === "PURCHASED";
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        role="checkbox"
        aria-checked={bought}
        onClick={onToggle}
        className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left"
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-md border-2 ${
            bought ? "border-success bg-success text-white" : "border-border bg-surface"
          }`}
          aria-hidden
        >
          {bought ? <Icon name="check" className="size-4" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block font-semibold ${bought ? "text-text-muted line-through" : "text-text"}`}
          >
            {item.name}
          </span>
          <span className="block text-sm text-text-muted">
            {bought ? "Comprado · " : ""}
            {formatAmount(item.quantity, item.unit)}
            {item.origin === "MANUAL" ? " · Agregado a mano" : ""}
          </span>
          {duplicate ? (
            <span className="block text-sm text-warning">
              También está en las comidas.
            </span>
          ) : null}
        </span>
      </button>
      <div className="flex gap-2 px-3 pb-2">
        <button
          type="button"
          className="min-h-11 text-sm font-semibold text-text"
          onClick={onEdit}
        >
          {editing ? "Cerrar" : "Editar"}
        </button>
        <button
          type="button"
          className="min-h-11 text-sm font-semibold text-danger"
          onClick={onRemove}
        >
          Quitar
        </button>
      </div>
      {editing ? <ItemForm item={item} onSave={onSave} /> : null}
    </Card>
  );
}

function ItemForm({
  item,
  onSave,
}: {
  item?: ShoppingItem;
  onSave: (patch: {
    name: string;
    quantity: string | null;
    unit: UnitCode | null;
    category: ShoppingCategory;
  }) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? "");
  const [unit, setUnit] = useState<UnitCode>(item?.unit ?? "unit");
  const [category, setCategory] = useState<ShoppingCategory>(item?.category ?? "OTROS");
  return (
    <form
      className="space-y-3 border-t border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name,
          quantity:
            unit === "to_taste" || quantity.trim() === "" ? null : quantity.trim(),
          unit,
          category,
        });
      }}
    >
      <Field id={`nombre-${item?.id ?? "nuevo"}`} label="Nombre">
        <TextInput
          id={`nombre-${item?.id ?? "nuevo"}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id={`cantidad-${item?.id ?? "nuevo"}`} label="Cantidad">
          <TextInput
            id={`cantidad-${item?.id ?? "nuevo"}`}
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </Field>
        <Field id={`unidad-${item?.id ?? "nuevo"}`} label="Unidad">
          <SelectInput
            id={`unidad-${item?.id ?? "nuevo"}`}
            value={unit}
            onChange={(event) => setUnit(event.target.value as UnitCode)}
          >
            {UNIT_CODES.map((code) => (
              <option key={code} value={code}>
                {UNIT_LABELS[code]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <Field id={`rubro-${item?.id ?? "nuevo"}`} label="Dónde se compra">
        <SelectInput
          id={`rubro-${item?.id ?? "nuevo"}`}
          value={category}
          onChange={(event) => setCategory(event.target.value as ShoppingCategory)}
        >
          {SHOPPING_CATEGORIES.map((code) => (
            <option key={code} value={code}>
              {SHOPPING_CATEGORY_LABELS[code]}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Button type="submit">{item ? "Guardar" : "Agregar"}</Button>
    </form>
  );
}

function AddItem({
  onAdd,
}: {
  onAdd: (input: {
    name: string;
    quantity: string | null;
    unit: UnitCode | null;
    category: ShoppingCategory;
  }) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Agregar producto
      </Button>
    );
  }
  return (
    <Card>
      <h2 className="px-3 pt-3 font-display text-xl">Agregar producto</h2>
      <ItemForm
        key={formKey}
        onSave={(patch) => {
          if (onAdd(patch)) {
            setFormKey((value) => value + 1);
            setOpen(false);
          }
        }}
      />
    </Card>
  );
}
