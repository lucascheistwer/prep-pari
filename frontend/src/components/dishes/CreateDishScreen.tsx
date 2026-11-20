"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readPhoto } from "@/components/dishes/read-photo";
import { Button } from "@/components/ui/Button";
import { Field, Notice, SelectInput, TextInput } from "@/components/ui/kit";
import { Stepper } from "@/components/ui/Stepper";
import { createDish } from "@/data/kitchen-store";
import { DISH_CATEGORY_LABELS } from "@/domain/labels";
import { DISH_CATEGORIES, type DishCategory } from "@/domain/types";

export function CreateDishScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DishCategory>("OTROS");
  const [servings, setServings] = useState(4);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function onPhoto(file: File | undefined) {
    if (!file) {
      return;
    }
    try {
      setPhotoError(null);
      setImageDataUrl(await readPhoto(file));
    } catch (caught) {
      setPhotoError(
        caught instanceof Error ? caught.message : "No pudimos leer la foto.",
      );
    }
  }

  function save(suggest: boolean) {
    const result = createDish({
      title,
      category,
      baseServings: servings,
      imageDataUrl,
      suggest,
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/comidas/${result.value}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="font-display text-3xl text-text">Nueva comida</h1>
        <p className="mt-1 text-sm text-text-muted">Con el nombre alcanza.</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save(false);
        }}
      >
        <Field id="nombre" label="Nombre" error={error ?? undefined}>
          <TextInput
            id="nombre"
            value={title}
            autoFocus
            maxLength={80}
            placeholder="Tarta de verduras"
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field id="categoria" label="Categoría">
          <SelectInput
            id="categoria"
            value={category}
            onChange={(event) => setCategory(event.target.value as DishCategory)}
          >
            {DISH_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {DISH_CATEGORY_LABELS[item]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text">Porciones</p>
          <Stepper value={servings} onChange={setServings} label="porciones" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Foto</p>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-card border border-border bg-surface px-4 text-sm font-semibold text-text">
            {imageDataUrl ? "Cambiar foto" : "Agregar foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void onPhoto(event.target.files?.[0])}
            />
          </label>
          {imageDataUrl ? (
            <button
              type="button"
              className="ml-2 inline-flex min-h-11 items-center text-sm font-semibold text-text-muted"
              onClick={() => setImageDataUrl(null)}
            >
              Quitar
            </button>
          ) : null}
          {photoError ? <Notice tone="danger">{photoError}</Notice> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="w-full sm:w-auto">
            Guardar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => save(true)}
          >
            Sugerir ingredientes
          </Button>
        </div>
      </form>
    </div>
  );
}
