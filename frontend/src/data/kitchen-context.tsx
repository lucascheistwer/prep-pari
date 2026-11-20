"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "@/data/kitchen-store";

function subscribeToMount() {
  return () => {};
}

export function useKitchen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function KitchenGate({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  if (!ready) {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-3">
        <p className="sr-only">Cargando</p>
        <div className="h-8 w-40 animate-pulse rounded-card bg-surface-subtle" />
        <div className="h-28 animate-pulse rounded-card bg-surface" />
        <div className="h-28 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }
  return children;
}
