"use client";

import { Card } from "@/components/ui/kit";
import { Stepper } from "@/components/ui/Stepper";
import { useKitchen } from "@/data/kitchen-context";
import { setCooksFor } from "@/data/kitchen-store";

export function HouseScreen() {
  const { cooksFor } = useKitchen();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl text-text">La casa</h1>
        <p className="mt-1 text-sm leading-6 text-text-muted">
          Un solo número para toda la casa. Con eso calculamos las compras.
        </p>
      </div>
      <Card className="space-y-4 p-4">
        <p className="text-base font-semibold text-text">
          ¿Para cuántos cocinás normalmente?
        </p>
        <Stepper
          value={cooksFor}
          onChange={(value) => setCooksFor(value)}
          label="personas"
        />
        <p className="text-sm text-text-muted">Si no lo cambiás, usamos 4.</p>
      </Card>
    </div>
  );
}
