"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClass } from "@/components/ui/Button";
import {
  ApiError,
  api,
  errorMessage,
  formatWhen,
  type InvitationPreview,
} from "@/lib/api";

export function AcceptInvitationScreen() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<InvitationPreview>(`/api/v1/invitations/${encodeURIComponent(token)}`)
      .then((value) => {
        if (!cancelled) setPreview(value);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof ApiError && reason.code === "UNAUTHENTICATED") {
          router.replace(`/ingresar?siguiente=/invitacion/${encodeURIComponent(token)}`);
          return;
        }
        setError(errorMessage(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const accepted = await api<{ householdId: string }>(
        `/api/v1/invitations/${encodeURIComponent(token)}/accept`,
        { method: "POST" },
      );
      router.replace(`/hogar/${accepted.householdId}`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "ALREADY_MEMBER" && preview) {
        router.replace(`/hogar/${preview.householdId}`);
        return;
      }
      setError(errorMessage(reason));
      setBusy(false);
    }
  }

  return (
    <Shell>
      {loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {preview ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-4xl tracking-tight text-balance">
              Te invitaron a {preview.householdName}
            </h1>
            <p className="text-base leading-7 text-text-muted">
              {preview.inviterName} te invitó a organizar las comidas de este hogar. El
              enlace vence el {formatWhen(preview.expiresAt)}.
            </p>
          </div>
          {preview.alreadyMember ? (
            <>
              <Alert tone="success">{`Ya formás parte de ${preview.householdName}.`}</Alert>
              <a
                href={`/hogar/${preview.householdId}`}
                className={buttonClass("primary", "w-full")}
              >
                Ir al hogar
              </a>
            </>
          ) : (
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              onClick={() => void accept()}
            >
              {busy ? "Uniéndote…" : "Unirme al hogar"}
            </Button>
          )}
        </div>
      ) : null}
    </Shell>
  );
}
