"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClass } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, api, errorMessage, type AuthConfig, type Me } from "@/lib/api";
import { safeNext } from "@/lib/navigation";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("siguiente"));
  const buttonHost = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleFailed, setGoogleFailed] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<Me>("/api/v1/me")
      .then(() => {
        if (!cancelled) router.replace(next);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof ApiError && reason.code === "UNAUTHENTICATED") {
          setLoading(false);
          return;
        }
        setError(errorMessage(reason));
        setLoading(false);
      });
    api<AuthConfig>("/api/v1/auth/config")
      .then((value) => {
        if (!cancelled) setConfig(value);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(errorMessage(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  useEffect(() => {
    const clientId = config?.googleClientId;
    const host = buttonHost.current;
    if (!clientId || !host) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !buttonHost.current) return;
      const parent = buttonHost.current;
      parent.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          setBusy(true);
          setError(null);
          api("/api/v1/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken: response.credential }),
          })
            .then(() => router.replace(next))
            .catch((reason: unknown) => setError(errorMessage(reason)))
            .finally(() => setBusy(false));
        },
      });
      window.google.accounts.id.renderButton(parent, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.max(240, Math.min(400, parent.clientWidth || 320)),
        locale: "es",
      });
    };

    if (window.google) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-gis='true']");
    const script = existing ?? document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client?hl=es";
    script.async = true;
    script.dataset.gis = "true";
    script.addEventListener("load", render);
    script.addEventListener("error", () => setGoogleFailed(true));
    if (!existing) document.body.appendChild(script);
    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, [config?.googleClientId, next, router]);

  async function onDev(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.trim();
    const devSubject = toDevSubject(displayName);
    if (!devSubject) {
      setError("Escribí tu nombre.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/v1/auth/dev", {
        method: "POST",
        body: JSON.stringify({
          subject: devSubject,
          displayName,
        }),
      });
      router.replace(next);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-tight text-balance">
          Entrá a PrepPari
        </h1>
        <p className="text-base leading-7 text-text-muted">
          Las comidas de tu casa, en un solo lugar.
        </p>
      </div>
      {loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {config?.googleClientId ? (
        <div className="space-y-2">
          <div ref={buttonHost} className="min-h-11" />
          {googleFailed ? (
            <Alert tone="error">No pudimos entrar con Google. Intentá de nuevo.</Alert>
          ) : null}
        </div>
      ) : null}
      {config?.devLoginEnabled ? (
        devOpen ? (
          <form onSubmit={onDev} className="space-y-3">
            <TextField
              id="nombre"
              label="Tu nombre"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
              {busy ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        ) : (
          <button
            type="button"
            className={buttonClass("ghost", "w-full")}
            onClick={() => setDevOpen(true)}
          >
            Entrar sin Google
          </button>
        )
      ) : null}
    </Shell>
  );
}

function toDevSubject(name: string) {
  const subject = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(subject) ? subject : "";
}
