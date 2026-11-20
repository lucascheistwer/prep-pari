"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { Alert } from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { ApiError, api, errorMessage, type Me } from "@/lib/api";

export function HomeGate() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Me>("/api/v1/me")
      .then((value) => {
        if (value.households.length === 0) {
          router.replace("/hogar/nuevo");
          return;
        }
        if (value.households.length === 1) {
          router.replace(`/hogar/${value.households[0].id}`);
          return;
        }
        setMe(value);
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.code === "UNAUTHENTICATED") {
          router.replace("/ingresar");
          return;
        }
        setError(errorMessage(reason));
      });
  }, [router]);

  return (
    <Shell>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {me ? (
        <div className="space-y-4">
          <h1 className="font-display text-4xl tracking-tight">Tus hogares</h1>
          <ul className="space-y-2">
            {me.households.map((household) => (
              <li key={household.id}>
                <Link
                  href={`/hogar/${household.id}`}
                  className={buttonClass("secondary", "w-full justify-between")}
                >
                  <span>{household.name}</span>
                  <span className="text-text-muted">
                    {household.role === "OWNER" ? "Administrás" : "Integrante"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : error ? null : (
        <p className="text-sm text-text-muted">Cargando…</p>
      )}
    </Shell>
  );
}
