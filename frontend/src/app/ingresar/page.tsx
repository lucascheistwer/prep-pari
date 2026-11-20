import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata = {
  title: "Ingresar · PrepPari",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-text-muted">Cargando…</p>}>
      <LoginScreen />
    </Suspense>
  );
}
