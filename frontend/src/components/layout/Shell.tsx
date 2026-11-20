"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";
import { ApiError, api, type Me } from "@/lib/api";

export function Shell({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout?: () => void;
}) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Me>("/api/v1/me")
      .then((me) => {
        if (!cancelled) setName(me.displayName);
      })
      .catch((reason: unknown) => {
        if (!cancelled && reason instanceof ApiError) setName(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = name?.trim().charAt(0).toLocaleUpperCase("es-AR");

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
          {name || onLogout ? (
            <div className="flex min-w-0 items-center gap-2">
              {name ? (
                <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-accent text-text"
                  >
                    {initial}
                  </span>
                  <span className="truncate">{name}</span>
                  <span className="sr-only">Sesión de {name}</span>
                </p>
              ) : null}
              {onLogout ? (
                <button type="button" className={buttonClass("ghost")} onClick={onLogout}>
                  Salir
                </button>
              ) : null}
            </div>
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
