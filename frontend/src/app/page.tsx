import { Suspense } from "react";
import { HomeGate } from "@/components/household/HomeGate";

export default function Home() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-text-muted">Cargando…</p>}>
      <HomeGate />
    </Suspense>
  );
}
