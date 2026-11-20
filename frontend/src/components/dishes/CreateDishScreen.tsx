"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readPhoto } from "@/components/dishes/read-photo";
import { buttonClass, Button } from "@/components/ui/Button";
import { Field, Notice, SelectInput, TextArea, TextInput } from "@/components/ui/kit";
import { createDish } from "@/data/kitchen-store";
import { DISH_CATEGORY_LABELS } from "@/domain/labels";
import { DISH_CATEGORIES, type DishCategory } from "@/domain/types";

export function CreateDishScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DishCategory>("OTROS");
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
    const result = createDish({ title, description, category, imageDataUrl, suggest });
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
        <p className="mt-1 text-sm leading-6 text-text-muted">
          Con el nombre alcanza. La descripción es opcional.
        </p>
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
        <Field id="descripcion" label="Descripción" hint="Opcional.">
          <TextArea
            id="descripcion"
            value={description}
            maxLength={400}
            rows={3}
            placeholder="La de los domingos, con mucha acelga"
            onChange={(event) => setDescription(event.target.value)}
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
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Foto</p>
          <div className="flex flex-wrap gap-2">
            <label className={buttonClass("secondary", "cursor-pointer")}>
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
                className={buttonClass("ghost")}
                onClick={() => setImageDataUrl(null)}
              >
                Quitar
              </button>
            ) : null}
          </div>
          {photoError ? <Notice tone="danger">{photoError}</Notice> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full">
            Guardar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => save(true)}
          >
            Sugerir ingredientes
          </Button>
          <p className="text-sm text-text-muted">
            Si sugerís, revisá las cantidades antes de usarlas.
          </p>
        </div>
      </form>
    </div>
  );
}
