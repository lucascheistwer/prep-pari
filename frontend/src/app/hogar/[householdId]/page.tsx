import { Suspense } from "react";
import { HouseholdScreen } from "@/components/household/HouseholdScreen";

export const metadata = {
  title: "Hogar · PrepPari",
};

export default function HouseholdPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-text-muted">Cargando…</p>}>
      <HouseholdScreen />
    </Suspense>
  );
}
