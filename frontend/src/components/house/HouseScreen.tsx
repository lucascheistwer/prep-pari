"use client";

import { Stepper } from "@/components/ui/Stepper";
import { useKitchen } from "@/data/kitchen-context";
import { setCooksFor } from "@/data/kitchen-store";

export function HouseScreen() {
  const { cooksFor } = useKitchen();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-3xl text-text">La casa</h1>
      <div className="space-y-3">
        <p className="text-base font-semibold text-text">
          ¿Para cuántos cocinás normalmente?
        </p>
        <Stepper
          value={cooksFor}
          onChange={(value) => setCooksFor(value)}
          label="personas"
        />
      </div>
    </div>
  );
}
