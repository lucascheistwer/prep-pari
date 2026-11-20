"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { api, errorMessage, type Household, type Me } from "@/lib/api";

export function CreateHouseholdScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Me>("/api/v1/me")
      .then((me) => {
        const household = me.households[0];
        if (!cancelled && household) router.replace(`/hogar/${household.id}`);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const household = await api<Household>("/api/v1/households", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      router.replace(`/hogar/${household.id}`);
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  }

  async function logout() {
    await api("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/ingresar");
  }

  return (
    <Shell onLogout={() => void logout()}>
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-tight text-balance">
          Creá tu hogar
        </h1>
        <p className="text-base leading-7 text-text-muted">
          Un nombre alcanza para empezar.
        </p>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-card border border-border bg-surface p-4"
      >
        <TextField
          id="hogar"
          label="Nombre del hogar"
          placeholder="Casa"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creando…" : "Crear hogar"}
        </Button>
      </form>
    </Shell>
  );
}
