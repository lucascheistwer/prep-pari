"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScaledIngredients } from "@/components/dishes/ScaledIngredients";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card, Notice, TextInput } from "@/components/ui/kit";
import { Stepper } from "@/components/ui/Stepper";
import { useKitchen } from "@/data/kitchen-context";
import { moveEntry, removeEntry, setEntry, setServings } from "@/data/kitchen-store";
import { mealLabel } from "@/domain/labels";
import type { Dish, MealEntry, MealType } from "@/domain/types";
import {
  addDays,
  dayHeading,
  todayIso,
  weekDays,
  weekRangeLabel,
  weekStartIso,
} from "@/domain/week";

export function PlannerScreen() {
  const snapshot = useKitchen();
  const [start, setStart] = useState(() => weekStartIso(todayIso()));
  const [picker, setPicker] = useState<{ date: string; mealType: MealType } | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const today = todayIso();
  const days = weekDays(start);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-text">Plan de la semana</h1>
        <p className="mt-1 text-sm text-text-muted">
          Almuerzo y cena, de lunes a domingo.
        </p>
      </div>
      <WeekBar start={start} onChange={setStart} />
      {message ? <Notice tone="info">{message}</Notice> : null}
      <div className="space-y-4 lg:hidden">
        {days.map((date) => (
          <DayColumn
            key={date}
            date={date}
            today={today}
            entries={snapshot.entries}
            dishes={snapshot.dishes}
            open={open}
            onOpen={setOpen}
            onPick={(mealType) => {
              setMessage(null);
              setPicker({ date, mealType });
            }}
            onMove={(entryId) => {
              setMessage(null);
              setMoving(entryId);
            }}
            onServings={(entryId, servings) => setServings(entryId, servings)}
            onRemove={removeEntry}
          />
        ))}
      </div>
      <div className="hidden gap-2 lg:grid lg:grid-cols-7">
        {days.map((date) => (
          <DayColumn
            key={`desk-${date}`}
            date={date}
            today={today}
            entries={snapshot.entries}
            dishes={snapshot.dishes}
            open={open}
            onOpen={setOpen}
            compact
            onPick={(mealType) => {
              setMessage(null);
              setPicker({ date, mealType });
            }}
            onMove={(entryId) => {
              setMessage(null);
              setMoving(entryId);
            }}
            onServings={(entryId, servings) => setServings(entryId, servings)}
            onRemove={removeEntry}
          />
        ))}
      </div>
      {picker ? (
        <DishPicker
          dishes={snapshot.dishes}
          initialServings={snapshot.cooksFor}
          onClose={() => setPicker(null)}
          onChoose={(dishId, servings) => {
            setEntry({ ...picker, dishId, servings });
            setPicker(null);
          }}
        />
      ) : null}
      {moving ? (
        <MoveSheet
          days={days}
          entries={snapshot.entries}
          entryId={moving}
          onClose={() => setMoving(null)}
          onMove={(date, mealType) => {
            const result = moveEntry(moving, date, mealType);
            if (!result.ok) {
              setMessage(result.message);
              return;
            }
            setMoving(null);
            setMessage(null);
          }}
        />
      ) : null}
    </div>
  );
}

function WeekBar({
  start,
  onChange,
}: {
  start: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="Semana anterior"
        className="grid size-11 place-items-center rounded-card border border-border bg-surface"
        onClick={() => onChange(addDays(start, -7))}
      >
        <Icon name="chevronLeft" />
      </button>
      <p className="text-sm font-semibold text-text">{weekRangeLabel(start)}</p>
      <button
        type="button"
        aria-label="Semana siguiente"
        className="grid size-11 place-items-center rounded-card border border-border bg-surface"
        onClick={() => onChange(addDays(start, 7))}
      >
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}

function DayColumn({
  date,
  today,
  entries,
  dishes,
  open,
  compact = false,
  onOpen,
  onPick,
  onMove,
  onServings,
  onRemove,
}: {
  date: string;
  today: string;
  entries: MealEntry[];
  dishes: Dish[];
  open: string | null;
  compact?: boolean;
  onOpen: (id: string | null) => void;
  onPick: (mealType: MealType) => void;
  onMove: (entryId: string) => void;
  onServings: (entryId: string, servings: number) => void;
  onRemove: (entryId: string) => void;
}) {
  return (
    <section className="space-y-2" aria-labelledby={`dia-${compact ? "d-" : ""}${date}`}>
      <h2
        id={`dia-${compact ? "d-" : ""}${date}`}
        className="flex items-center gap-2 text-base font-semibold text-text"
      >
        {dayHeading(date)}
        {date === today ? (
          <span className="rounded-full bg-brand-accent px-2 py-0.5 text-xs font-semibold text-text">
            Hoy
          </span>
        ) : null}
      </h2>
      {(["LUNCH", "DINNER"] as const).map((mealType) => {
        const entry = entries.find(
          (item) => item.date === date && item.mealType === mealType,
        );
        const dish = entry ? dishes.find((item) => item.id === entry.dishId) : undefined;
        return (
          <Card key={mealType} className="space-y-2 p-3">
            <p className="text-sm text-text-muted">{mealLabel(mealType)}</p>
            {entry && dish ? (
              <>
                <Link
                  href={`/comidas/${dish.id}`}
                  className="block font-semibold text-text"
                >
                  {dish.title}
                </Link>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-muted">Para cuántos</span>
                  <Stepper
                    value={entry.servings}
                    label={`para cuántos, ${dish.title}`}
                    onChange={(servings) => onServings(entry.id, servings)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-brand-primary"
                    onClick={() => onPick(mealType)}
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-text"
                    onClick={() => onMove(entry.id)}
                  >
                    Mover
                  </button>
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-text"
                    onClick={() => onOpen(open === entry.id ? null : entry.id)}
                  >
                    {open === entry.id ? "Ocultar" : "Ingredientes"}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-danger"
                    onClick={() => onRemove(entry.id)}
                  >
                    Quitar
                  </button>
                </div>
                {open === entry.id ? (
                  <ScaledIngredients
                    ingredients={dish.ingredients}
                    baseServings={dish.baseServings}
                    servings={entry.servings}
                  />
                ) : null}
              </>
            ) : (
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-center rounded-card border border-dashed border-border text-sm font-semibold text-text"
                onClick={() => onPick(mealType)}
              >
                Elegir {mealLabel(mealType).toLowerCase()}
              </button>
            )}
          </Card>
        );
      })}
    </section>
  );
}

function DishPicker({
  dishes,
  initialServings,
  onClose,
  onChoose,
}: {
  dishes: { id: string; title: string }[];
  initialServings: number;
  onClose: () => void;
  onChoose: (dishId: string, servings: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [dishId, setDishId] = useState<string | null>(null);
  const [servings, setServings] = useState(initialServings);
  const visible = useMemo(
    () =>
      dishes.filter((dish) =>
        dish.title.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [dishes, query],
  );
  const chosen = dishes.find((dish) => dish.id === dishId);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="elegir-titulo"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 id="elegir-titulo" className="font-display text-2xl text-text">
            Elegir comida
          </h2>
          <button
            type="button"
            className="grid size-11 place-items-center"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <TextInput
          aria-label="Buscar comida"
          value={query}
          placeholder="Buscar"
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="space-y-2">
          {visible.map((dish) => (
            <li key={dish.id}>
              <button
                type="button"
                aria-pressed={dish.id === dishId}
                className={`flex min-h-14 w-full items-center rounded-card border px-3 text-left text-sm font-semibold ${
                  dish.id === dishId
                    ? "border-brand-primary bg-brand-accent/40"
                    : "border-border bg-surface"
                }`}
                onClick={() => setDishId(dish.id)}
              >
                {dish.title}
              </button>
            </li>
          ))}
        </ul>
        {chosen ? (
          <div className="mt-auto space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Para cuántos</p>
              <Stepper value={servings} onChange={setServings} label="para cuántos" />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => onChoose(chosen.id, servings)}
            >
              Poner en el plan
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MoveSheet({
  days,
  entries,
  entryId,
  onClose,
  onMove,
}: {
  days: string[];
  entries: MealEntry[];
  entryId: string;
  onClose: () => void;
  onMove: (date: string, mealType: MealType) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mover-titulo"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 id="mover-titulo" className="font-display text-2xl">
            Mover
          </h2>
          <button
            type="button"
            className="grid size-11 place-items-center"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <ul className="space-y-3">
          {days.map((date) => (
            <li key={date} className="space-y-2">
              <p className="text-sm font-semibold">{dayHeading(date)}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["LUNCH", "DINNER"] as const).map((mealType) => {
                  const occupied = entries.some(
                    (entry) =>
                      entry.id !== entryId &&
                      entry.date === date &&
                      entry.mealType === mealType,
                  );
                  return (
                    <button
                      key={mealType}
                      type="button"
                      disabled={occupied}
                      className="min-h-11 rounded-card border border-border bg-surface text-sm font-semibold disabled:opacity-40"
                      onClick={() => onMove(date, mealType)}
                    >
                      {occupied ? "Ya hay una" : mealLabel(mealType)}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
