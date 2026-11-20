"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { api, type Me } from "@/lib/api";

export function WayHome() {
  const [href, setHref] = useState("/hogar/nuevo");
  const [label, setLabel] = useState("Crear un hogar");

  useEffect(() => {
    let cancelled = false;
    api<Me>("/api/v1/me")
      .then((me) => {
        if (cancelled) return;
        const household = me.households[0];
        if (household) {
          setHref(`/hogar/${household.id}`);
          setLabel("Ir a tu hogar");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHref("/ingresar");
          setLabel("Entrar");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link href={href} className={buttonClass("primary", "w-full")}>
      {label}
    </Link>
  );
}
