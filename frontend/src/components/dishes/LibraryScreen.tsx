"use client";

import Link from "next/link";
import { useState } from "react";
import { DishVisual } from "@/components/dishes/DishVisual";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { Card, Chip, EmptyState, selectableClass, TextInput } from "@/components/ui/kit";
import { useKitchen } from "@/data/kitchen-context";
import { updateDish } from "@/data/kitchen-store";
import { dishStatusLabel, filterDishes } from "@/domain/dishes";
import { DISH_CATEGORY_LABELS } from "@/domain/labels";
import { DISH_CATEGORIES, type DishCategory } from "@/domain/types";

export function LibraryScreen() {
  const { dishes } = useKitchen();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<DishCategory | "ALL" | "FAVORITES">("ALL");
  const visible = filterDishes(dishes, { text, category });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-text">Mis comidas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Las que van a aparecer cuando armes la semana.
          </p>
        </div>
        <ButtonLink href="/comidas/nueva" className="w-full shrink-0 sm:w-auto">
          Agregar comida
        </ButtonLink>
      </div>

      {dishes.length > 0 ? (
        <>
          <div className="space-y-1">
            <label
              htmlFor="buscar-comida"
              className="block text-sm font-semibold text-text"
            >
              Buscar
            </label>
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
              />
              <TextInput
                id="buscar-comida"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Nombre o ingrediente"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">Filtrar</p>
            <div className="flex flex-wrap gap-2.5">
              <Chip active={category === "ALL"} onClick={() => setCategory("ALL")}>
                Todas
              </Chip>
              <Chip
                active={category === "FAVORITES"}
                onClick={() => setCategory("FAVORITES")}
              >
                Favoritas
              </Chip>
              {DISH_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  active={category === item}
                  onClick={() => setCategory(item)}
                >
                  {DISH_CATEGORY_LABELS[item]}
                </Chip>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title={
            dishes.length === 0 ? "Todavía no hay comidas" : "Ninguna comida coincide"
          }
          text={
            dishes.length === 0
              ? "Guardá la primera. Con el nombre alcanza, y después la usás en la semana."
              : "Probá con otro nombre o elegí Todas."
          }
          action={
            dishes.length === 0 ? (
              <ButtonLink href="/comidas/nueva">Agregar comida</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((dish) => (
            <li key={dish.id}>
              <Card className="overflow-hidden">
                <Link
                  href={`/comidas/${dish.id}`}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  <DishVisual
                    title={dish.title}
                    category={dish.category}
                    imageDataUrl={dish.imageDataUrl}
                    className="h-36 w-full"
                  />
                  <div className="space-y-1 p-3">
                    <h2 className="text-base font-semibold text-text">{dish.title}</h2>
                    {dish.description ? (
                      <p className="line-clamp-2 text-sm text-text-muted">
                        {dish.description}
                      </p>
                    ) : null}
                    <p className="text-sm text-text-muted">
                      {DISH_CATEGORY_LABELS[dish.category]} · {dishStatusLabel(dish)}
                    </p>
                  </div>
                </Link>
                <div className="px-3 pb-3">
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
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
