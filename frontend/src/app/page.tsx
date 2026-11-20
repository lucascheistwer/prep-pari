import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { ColorSwatch } from "@/components/ui/ColorSwatch";
import { brandPalette, statusPalette } from "@/design/palette";

const sections = ["Inicio", "Comidas", "Plan", "Compras"] as const;

export default function Home() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20 focus:rounded-card focus:bg-surface focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Wordmark />
          <p className="rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold text-text">
            Fase 0
          </p>
        </div>
      </header>
      <main
        id="contenido"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8"
      >
        <section className="max-w-2xl space-y-3">
          <h1 className="font-display text-4xl tracking-tight text-balance text-text">
            Las comidas del hogar, en un solo lugar.
          </h1>
          <p className="text-base leading-7 text-text-muted">
            PrepPari va a guardar comidas, armar el plan de la semana y compartir la lista
            de compras. Esta pantalla es la base visual Tomato &amp; Butter: todavía no
            hay cuentas, biblioteca ni lista.
          </p>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl text-text">Paleta</h2>
            <p className="text-sm text-text-muted">
              Butter lleva texto espresso. Tomato lleva texto blanco. Los colores de
              estado no reemplazan a la marca.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {brandPalette.map((entry) => (
              <ColorSwatch key={entry.token} {...entry} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statusPalette.map((entry) => (
              <ColorSwatch key={entry.token} {...entry} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-text">Acciones</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="w-full sm:w-auto">
              Primario
            </Button>
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Secundario
            </Button>
            <Button type="button" variant="ghost" className="w-full sm:w-auto">
              Fantasma
            </Button>
          </div>
        </section>
      </main>
      <nav
        aria-label="Secciones próximas"
        className="mt-auto border-t border-border bg-surface"
      >
        <p className="sr-only">
          La navegación se habilita con las pantallas del producto.
        </p>
        <ul className="mx-auto grid max-w-5xl grid-cols-4">
          {sections.map((section) => (
            <li key={section}>
              <span className="flex min-h-14 items-center justify-center text-xs font-medium text-text-muted">
                {section}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
