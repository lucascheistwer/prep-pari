"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-3 py-8 text-center">
      <h1 className="font-display text-2xl text-text">No pudimos mostrar esto</h1>
      <p className="text-sm text-text-muted">Volvé a intentar.</p>
      <Button type="button" onClick={() => retry()}>
        Reintentar
      </Button>
    </div>
  );
}
