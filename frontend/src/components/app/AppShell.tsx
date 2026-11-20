"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";

const items = [
  { href: "/inicio", label: "Inicio", icon: "home" },
  { href: "/comidas", label: "Comidas", icon: "book" },
  { href: "/plan", label: "Plan", icon: "calendar" },
  { href: "/compras", label: "Compras", icon: "basket" },
] as const;

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-1 flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-30 focus:rounded-card focus:bg-surface focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/inicio" aria-label="PrepPari, inicio">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones">
            {items.map((item) => {
              const current = active(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-card px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                    current
                      ? "bg-brand-accent text-text"
                      : "text-text-muted hover:bg-surface-subtle"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div
        id="contenido"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-28 md:pb-10"
      >
        {children}
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
        aria-label="Secciones"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {items.map((item) => {
            const current = active(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                    current
                      ? "border-brand-primary text-brand-primary"
                      : "border-transparent text-text-muted"
                  }`}
                >
                  <Icon name={item.icon} className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
