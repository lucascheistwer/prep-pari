import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";

export function Shell({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout?: () => void;
}) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20 focus:rounded-card focus:bg-surface focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
          <Link href="/" aria-label="PrepPari, inicio">
            <Wordmark />
          </Link>
          {onLogout ? (
            <button type="button" className={buttonClass("ghost")} onClick={onLogout}>
              Salir
            </button>
          ) : null}
        </div>
      </header>
      <main
        id="contenido"
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6"
      >
        {children}
      </main>
    </>
  );
}
