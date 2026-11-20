"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DishVisual } from "@/components/dishes/DishVisual";
import { readPhoto } from "@/components/dishes/read-photo";
import { ScaledIngredients } from "@/components/dishes/ScaledIngredients";
import { buttonClass, Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import {
  Card,
  Field,
  Notice,
  SelectInput,
  selectableClass,
  TextArea,
  TextInput,
} from "@/components/ui/kit";
import { useKitchen } from "@/data/kitchen-context";
import {
  deleteDish,
  saveIngredients,
  suggestDish,
  updateDish,
} from "@/data/kitchen-store";
import { dishStatusLabel } from "@/domain/dishes";
import { formatYield } from "@/domain/recipes";
import {
  DISH_CATEGORY_LABELS,
  SHOPPING_CATEGORY_LABELS,
  UNIT_LABELS,
} from "@/domain/labels";
import {
  DISH_CATEGORIES,
  SHOPPING_CATEGORIES,
  UNIT_CODES,
  type DishCategory,
  type IngredientDraft,
  type ShoppingCategory,
  type UnitCode,
} from "@/domain/types";

export function DishScreen({ dishId }: { dishId: string }) {
  const snapshot = useKitchen();
  const dish = snapshot.dishes.find((item) => item.id === dishId);
  if (!dish) {
    return (
      <div className="mx-auto max-w-lg">
        <ButtonLink href="/comidas" variant="secondary">
          Volver a las comidas
        </ButtonLink>
        <div className="mt-4">
          <Notice tone="info">No encontramos esa comida.</Notice>
        </div>
      </div>
    );
  }
  return <DishEditor key={dish.id} dishId={dish.id} />;
}

function DishEditor({ dishId }: { dishId: string }) {
  const router = useRouter();
  const snapshot = useKitchen();
  const dish = snapshot.dishes.find((item) => item.id === dishId);
  const [title, setTitle] = useState(dish?.title ?? "");
  const [description, setDescription] = useState(dish?.description ?? "");
  const [editing, setEditing] = useState(false);
  const [confirmSuggest, setConfirmSuggest] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("");
  const [draftUnit, setDraftUnit] = useState<UnitCode>("g");
  const [draftCategory, setDraftCategory] = useState<ShoppingCategory>("VERDULERIA");

  if (!dish) {
    return null;
  }

  const planned = snapshot.entries.some((entry) => entry.dishId === dish.id);
  const estimated = dish.ingredients.some(
    (ingredient) =>
      ingredient.source === "AI_ESTIMATED" || ingredient.source === "AI_EXPLICIT",
  );

  async function onPhoto(file: File | undefined) {
    if (!file) {
      return;
    }
    try {
      setPhotoError(null);
      const imageDataUrl = await readPhoto(file);
      const result = updateDish(dishId, { imageDataUrl });
      if (!result.ok) {
        setPhotoError(result.message);
      }
    } catch (caught) {
      setPhotoError(
        caught instanceof Error ? caught.message : "No pudimos leer la foto.",
      );
    }
  }

  function persistTitle() {
    if (title.trim() === dish?.title) {
      return;
    }
    const result = updateDish(dishId, { title });
    if (!result.ok) {
      setError(result.message);
      setTitle(dish?.title ?? "");
    }
  }

  function persistDescription() {
    if (description.trim() === (dish?.description ?? "")) {
      return;
    }
    const result = updateDish(dishId, { description });
    if (!result.ok) {
      setError(result.message);
      setDescription(dish?.description ?? "");
    }
  }

  function addIngredient() {
    const name = draftName.trim();
    if (!name || !dish) {
      setError("Escribí el ingrediente.");
      return;
    }
    const draft: IngredientDraft = {
      id: crypto.randomUUID(),
      name,
      quantity:
        draftUnit === "to_taste" || draftQuantity.trim() === ""
          ? null
          : draftQuantity.trim(),
      unit: draftUnit,
      category: draftCategory,
      note: null,
    };
    const result = saveIngredients(dish.id, [...dish.ingredients.map(toDraft), draft]);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDraftName("");
    setDraftQuantity("");
    setError(null);
  }

  function removeIngredient(id: string) {
    if (!dish) {
      return;
    }
    saveIngredients(
      dish.id,
      dish.ingredients.filter((ingredient) => ingredient.id !== id).map(toDraft),
    );
  }

  function updateIngredient(id: string, patch: Partial<IngredientDraft>) {
    if (!dish) {
      return;
    }
    saveIngredients(
      dish.id,
      dish.ingredients.map((ingredient) =>
        ingredient.id === id ? { ...toDraft(ingredient), ...patch } : toDraft(ingredient),
      ),
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <ButtonLink href="/comidas" variant="secondary">
        Comidas
      </ButtonLink>
      <Card className="overflow-hidden">
        <DishVisual
          title={dish.title}
          category={dish.category}
          imageDataUrl={dish.imageDataUrl}
          className="h-52 w-full"
        />
        <div className="flex flex-wrap gap-2 p-3">
          <label className={buttonClass("secondary", "cursor-pointer")}>
            <Icon name="camera" className="size-5" />
            {dish.imageDataUrl ? "Cambiar foto" : "Agregar foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void onPhoto(event.target.files?.[0])}
            />
          </label>
          {dish.imageDataUrl ? (
            <button
              type="button"
              className={buttonClass("ghost")}
              onClick={() => updateDish(dish.id, { imageDataUrl: null })}
            >
              Quitar foto
            </button>
          ) : null}
        </div>
      </Card>
      {photoError ? <Notice tone="danger">{photoError}</Notice> : null}

      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl text-balance text-text">{dish.title}</h1>
        <button
          type="button"
          aria-pressed={dish.favorite}
          onClick={() => updateDish(dish.id, { favorite: !dish.favorite })}
          className={selectableClass(dish.favorite)}
        >
          <Icon
            name="heart"
            className={`size-5 ${dish.favorite ? "fill-brand-primary text-brand-primary" : ""}`}
          />
          {dish.favorite ? "Favorita" : "Marcar favorita"}
        </button>
      </div>

      <Field id="nombre-comida" label="Nombre" error={error ?? undefined}>
        <TextInput
          id="nombre-comida"
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={persistTitle}
        />
      </Field>

      <Field id="categoria-comida" label="Categoría">
        <SelectInput
          id="categoria-comida"
          value={dish.category}
          onChange={(event) =>
            updateDish(dish.id, { category: event.target.value as DishCategory })
          }
        >
          {DISH_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {DISH_CATEGORY_LABELS[item]}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field id="descripcion-comida" label="Descripción" hint="Opcional.">
        <TextArea
          id="descripcion-comida"
          value={description}
          maxLength={400}
          rows={3}
          placeholder="Un detalle para reconocerla"
          onChange={(event) => setDescription(event.target.value)}
          onBlur={persistDescription}
        />
      </Field>

      <p className="text-sm text-text-muted">{formatYield(dish)}</p>

      <p className="text-sm text-text-muted">{dishStatusLabel(dish)}</p>
      {dish.ingredientsStatus === "PENDING" ? (
        <Notice tone="info">Estamos armando una sugerencia.</Notice>
      ) : null}
      {dish.ingredientsStatus === "FAILED" ? (
        <Notice tone="danger">No se pudo completar.</Notice>
      ) : null}
      {estimated && dish.ingredientsStatus === "READY" ? (
        <Notice tone="info">Revisá las cantidades. Son una sugerencia.</Notice>
      ) : null}

      <section className="space-y-3" aria-labelledby="ingredientes">
        <div className="flex items-center justify-between gap-3">
          <h2 id="ingredientes" className="font-display text-2xl text-text">
            Ingredientes
          </h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Ver" : "Corregir"}
          </Button>
        </div>
        <ScaledIngredients
          ingredients={dish.ingredients}
          baseServings={dish.baseServings}
          servings={dish.baseServings}
        />
        {editing ? (
          <ul className="space-y-3">
            {dish.ingredients.map((ingredient) => (
              <li key={ingredient.id}>
                <Card className="space-y-3 p-3">
                  <Field id={`nombre-${ingredient.id}`} label="Ingrediente">
                    <TextInput
                      id={`nombre-${ingredient.id}`}
                      defaultValue={ingredient.name}
                      onBlur={(event) =>
                        updateIngredient(ingredient.id, { name: event.target.value })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field id={`cantidad-${ingredient.id}`} label="Cantidad">
                      <TextInput
                        id={`cantidad-${ingredient.id}`}
                        inputMode="decimal"
                        defaultValue={ingredient.quantity ?? ""}
                        onBlur={(event) =>
                          updateIngredient(ingredient.id, {
                            quantity: event.target.value.trim() || null,
                          })
                        }
                      />
                    </Field>
                    <Field id={`unidad-${ingredient.id}`} label="Unidad">
                      <SelectInput
                        id={`unidad-${ingredient.id}`}
                        defaultValue={ingredient.unit ?? "g"}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            unit: event.target.value as UnitCode,
                          })
                        }
                      >
                        {UNIT_CODES.map((unit) => (
                          <option key={unit} value={unit}>
                            {UNIT_LABELS[unit]}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>
                  <Field id={`rubro-${ingredient.id}`} label="Dónde se compra">
                    <SelectInput
                      id={`rubro-${ingredient.id}`}
                      defaultValue={ingredient.category}
                      onChange={(event) =>
                        updateIngredient(ingredient.id, {
                          category: event.target.value as ShoppingCategory,
                        })
                      }
                    >
                      {SHOPPING_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {SHOPPING_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeIngredient(ingredient.id)}
                  >
                    Quitar
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
        <Card className="space-y-3 p-3">
          <h3 className="text-sm font-semibold text-text">Agregar ingrediente</h3>
          <Field id="nuevo-ingrediente" label="Nombre">
            <TextInput
              id="nuevo-ingrediente"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="nueva-cantidad" label="Cantidad">
              <TextInput
                id="nueva-cantidad"
                inputMode="decimal"
                value={draftQuantity}
                onChange={(event) => setDraftQuantity(event.target.value)}
              />
            </Field>
            <Field id="nueva-unidad" label="Unidad">
              <SelectInput
                id="nueva-unidad"
                value={draftUnit}
                onChange={(event) => setDraftUnit(event.target.value as UnitCode)}
              >
                {UNIT_CODES.map((unit) => (
                  <option key={unit} value={unit}>
                    {UNIT_LABELS[unit]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field id="nuevo-rubro" label="Dónde se compra">
            <SelectInput
              id="nuevo-rubro"
              value={draftCategory}
              onChange={(event) =>
                setDraftCategory(event.target.value as ShoppingCategory)
              }
            >
              {SHOPPING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {SHOPPING_CATEGORY_LABELS[category]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Button type="button" variant="secondary" onClick={addIngredient}>
            Agregar
          </Button>
        </Card>
      </section>

      {confirmSuggest ? (
        <Card className="space-y-3 p-3">
          <p className="text-sm text-text">
            Hay ingredientes que corregiste. Si seguís, se mantienen y se reemplazan las
            sugerencias.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setConfirmSuggest(false);
                suggestDish(dish.id, true);
              }}
            >
              Reemplazar sugerencias
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmSuggest(false)}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={dish.ingredientsStatus === "PENDING"}
          onClick={() => {
            const result = suggestDish(dish.id, false);
            if (!result.ok && result.needsConfirmation) {
              setConfirmSuggest(true);
            }
          }}
        >
          {dish.ingredients.length === 0 ? "Sugerir ingredientes" : "Volver a sugerir"}
        </Button>
      )}

      {confirmDelete ? (
        <Card className="space-y-3 p-3">
          <p className="text-sm text-text">¿La sacamos de la biblioteca?</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                const result = deleteDish(dish.id);
                if (!result.ok) {
                  setError(result.message);
                  setConfirmDelete(false);
                  return;
                }
                router.push("/comidas");
              }}
            >
              Sacar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {planned ? (
            <Notice tone="info">Está en el plan. Sacala de ahí antes.</Notice>
          ) : null}
          <Button
            type="button"
            variant="danger"
            disabled={planned}
            onClick={() => setConfirmDelete(true)}
          >
            Sacar de la biblioteca
          </Button>
        </div>
      )}
    </div>
  );
}

function toDraft(ingredient: {
  id: string;
  name: string;
  quantity: string | null;
  unit: UnitCode | null;
  category: ShoppingCategory;
  note: string | null;
}): IngredientDraft {
  return {
    id: ingredient.id,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    category: ingredient.category,
    note: ingredient.note,
  };
}
