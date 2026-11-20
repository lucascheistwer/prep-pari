import { AppShell } from "@/components/app/AppShell";
import { KitchenGate } from "@/data/kitchen-context";
import type { ReactNode } from "react";

export default function CocinaLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <KitchenGate>{children}</KitchenGate>
    </AppShell>
  );
}
