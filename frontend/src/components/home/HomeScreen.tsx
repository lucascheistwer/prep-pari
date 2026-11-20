"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/kit";
import { useKitchen } from "@/data/kitchen-context";
import { mealLabel } from "@/domain/labels";
import { entriesForWeek, shoppingProgress } from "@/domain/shopping";
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
    .slice(0, 3);
  const hasDishes = snapshot.dishes.length > 0;
  const hasPlan = entriesForWeek(snapshot.entries, week).length > 0;
  const list = snapshot.lists.find((item) => item.weekStart === week);
  const progress = list && list.items.length > 0 ? shoppingProgress(list.items) : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl text-text">{greetingFor()}</h1>
        <p className="mt-1 text-sm text-text-muted">{longDate(today)}</p>
      </div>

      <NextStep hasDishes={hasDishes} hasPlan={hasPlan} hasList={progress != null} />

      {hasDishes ? (
        <section className="space-y-3" aria-labelledby="hoy">
          <div className="flex items-center justify-between gap-3">
            <h2 id="hoy" className="font-display text-2xl text-text">
              Hoy
            </h2>
            {hasPlan ? (
              <ButtonLink href="/plan" variant="secondary">
                Ver la semana
              </ButtonLink>
            ) : null}
          </div>
          <TodayMeal label="Almuerzo" entry={lunch} dishes={snapshot.dishes} />
          <TodayMeal label="Cena" entry={dinner} dishes={snapshot.dishes} />
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="space-y-3" aria-labelledby="despues">
          <h2 id="despues" className="font-display text-2xl text-text">
            Después
          </h2>
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
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {progress ? (
        <section className="space-y-3" aria-labelledby="lista">
          <h2 id="lista" className="font-display text-2xl text-text">
            Compras
          </h2>
          <Card className="space-y-3 p-4">
            <p className="text-sm text-text-muted">Lista de esta semana</p>
            <p className="font-display text-2xl text-text">{progress.label}</p>
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
            <ButtonLink href="/compras" className="w-full">
              Abrir la lista
            </ButtonLink>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function NextStep({
  hasDishes,
  hasPlan,
  hasList,
}: {
  hasDishes: boolean;
  hasPlan: boolean;
  hasList: boolean;
}) {
  if (!hasDishes) {
    return (
      <Card className="space-y-3 p-4">
        <h2 className="font-display text-2xl text-text">Empezá por una comida</h2>
        <p className="text-sm leading-6 text-text-muted">
          Guardá lo que suelen cocinar. Con el nombre alcanza. Después la ponés en la
          semana y armamos las compras.
        </p>
        <ButtonLink href="/comidas/nueva" className="w-full">
          Agregar comida
        </ButtonLink>
      </Card>
    );
  }
  if (!hasPlan) {
    return (
      <Card className="space-y-3 p-4">
        <h2 className="font-display text-2xl text-text">Armá la semana</h2>
        <p className="text-sm leading-6 text-text-muted">
          Elegí almuerzo y cena. La lista de compras sale de ahí.
        </p>
        <div className="flex flex-col gap-2">
          <ButtonLink href="/plan" className="w-full">
            Planificar la semana
          </ButtonLink>
          <ButtonLink href="/comidas/nueva" variant="secondary" className="w-full">
            Agregar otra comida
          </ButtonLink>
        </div>
      </Card>
    );
  }
  if (!hasList) {
    return (
      <Card className="space-y-3 p-4">
        <h2 className="font-display text-2xl text-text">Armá las compras</h2>
        <p className="text-sm leading-6 text-text-muted">
          Con las comidas de la semana, la lista queda lista para el súper.
        </p>
        <ButtonLink href="/compras" className="w-full">
          Armar la lista
        </ButtonLink>
      </Card>
    );
  }
  return (
    <ButtonLink href="/comidas/nueva" variant="secondary" className="w-full">
      Agregar comida
    </ButtonLink>
  );
}

function TodayMeal({
  label,
  entry,
  dishes,
}: {
  label: string;
  entry: { dishId: string } | undefined;
  dishes: { id: string; title: string }[];
}) {
  const dish = entry ? dishes.find((item) => item.id === entry.dishId) : undefined;
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold text-text-muted">{label}</p>
      {dish ? (
        <Link
          href={`/comidas/${dish.id}`}
          className="block rounded-card font-display text-2xl text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          {dish.title}
        </Link>
      ) : (
        <>
          <p className="text-text">Nada elegido</p>
          <ButtonLink href="/plan" variant="secondary" className="w-full">
            Elegir {label.toLowerCase()}
          </ButtonLink>
        </>
      )}
    </Card>
  );
}
