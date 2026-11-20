"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/kit";
import { useKitchen } from "@/data/kitchen-context";
import { mealLabel } from "@/domain/labels";
import { shoppingProgress } from "@/domain/shopping";
import { greetingFor, longDate, todayIso, weekStartIso } from "@/domain/week";

export function HomeScreen() {
  const snapshot = useKitchen();
  const today = todayIso();
  const week = weekStartIso(today);
  const lunch = snapshot.entries.find(
    (entry) => entry.date === today && entry.mealType === "LUNCH",
  );
  const dinner = snapshot.entries.find(
    (entry) => entry.date === today && entry.mealType === "DINNER",
  );
  const upcoming = snapshot.entries
    .filter((entry) => entry.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.mealType === "LUNCH" ? -1 : 1))
    .slice(0, 4);
  const list = snapshot.lists.find((item) => item.weekStart === week);
  const progress = list && list.items.length > 0 ? shoppingProgress(list.items) : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl text-text">{greetingFor()}</h1>
        <p className="mt-1 text-sm text-text-muted">{longDate(today)}</p>
      </div>

      <section className="space-y-3" aria-labelledby="hoy">
        <div className="flex items-center justify-between">
          <h2 id="hoy" className="font-display text-2xl text-text">
            Hoy
          </h2>
          <Link href="/plan" className="text-sm font-semibold text-brand-primary">
            Ver la semana
          </Link>
        </div>
        <TodayMeal label="Almuerzo" entry={lunch} dishes={snapshot.dishes} />
        <TodayMeal label="Cena" entry={dinner} dishes={snapshot.dishes} />
      </section>

      <section className="space-y-3" aria-labelledby="despues">
        <h2 id="despues" className="font-display text-2xl text-text">
          Después
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-text-muted">No hay más comidas en el plan.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((entry) => {
              const dish = snapshot.dishes.find((item) => item.id === entry.dishId);
              return (
                <li key={entry.id}>
                  <Card className="px-3 py-3">
                    <p className="text-sm text-text-muted">
                      {longDate(entry.date)} · {mealLabel(entry.mealType)}
                    </p>
                    <p className="mt-1 font-semibold text-text">
                      {dish?.title ?? "Comida"}
                    </p>
                    <p className="text-sm text-text-muted">{entry.servings} porciones</p>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="lista">
        <h2 id="lista" className="font-display text-2xl text-text">
          Compras
        </h2>
        <Card className="space-y-3 p-4">
          <p className="text-sm text-text-muted">Lista de esta semana</p>
          <p className="font-display text-2xl text-text">
            {progress ? progress.label : "Todavía no está armada"}
          </p>
          {progress ? (
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-subtle"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-brand-primary"
                style={{
                  width: `${Math.round((progress.purchased / progress.total) * 100)}%`,
                }}
              />
            </div>
          ) : null}
          <ButtonLink href="/compras" variant="secondary">
            Abrir la lista
          </ButtonLink>
        </Card>
      </section>

      <ButtonLink href="/comidas/nueva" className="w-full">
        Agregar comida
      </ButtonLink>
    </div>
  );
}

function TodayMeal({
  label,
  entry,
  dishes,
}: {
  label: string;
  entry: { dishId: string; servings: number } | undefined;
  dishes: { id: string; title: string }[];
}) {
  const dish = entry ? dishes.find((item) => item.id === entry.dishId) : undefined;
  return (
    <Card className="p-4">
      <p className="text-sm text-text-muted">{label}</p>
      {dish && entry ? (
        <Link href={`/comidas/${dish.id}`} className="mt-1 block">
          <span className="font-display text-2xl text-text">{dish.title}</span>
          <span className="mt-1 block text-sm text-text-muted">
            {entry.servings} porciones
          </span>
        </Link>
      ) : (
        <div className="mt-1 space-y-2">
          <p className="text-text">Nada planificado</p>
          <Link href="/plan" className="text-sm font-semibold text-brand-primary">
            Elegir comida
          </Link>
        </div>
      )}
    </Card>
  );
}
