"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { WayHome } from "@/components/household/WayHome";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClass } from "@/components/ui/Button";
import {
  ApiError,
  api,
  errorMessage,
  formatWhen,
  roleLabel,
  type CreatedInvitation,
  type Household,
} from "@/lib/api";

export function HouseholdScreen() {
  const router = useRouter();
  const params = useParams<{ householdId: string }>();
  const householdId = params.householdId;
  const [household, setHousehold] = useState<Household | null>(null);
  const [invitation, setInvitation] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Household>(`/api/v1/households/${householdId}`)
      .then((value) => {
        if (!cancelled) {
          setHousehold(value);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof ApiError && reason.code === "UNAUTHENTICATED") {
          router.replace(`/ingresar?siguiente=/hogar/${householdId}`);
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
  }, [householdId, router]);

  async function refresh() {
    setHousehold(await api<Household>(`/api/v1/households/${householdId}`));
    setError(null);
  }

  async function logout() {
    await api("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/ingresar");
  }

  async function createInvitation() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const created = await api<CreatedInvitation>(
        `/api/v1/households/${householdId}/invitations`,
        { method: "POST" },
      );
      setInvitation(created);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.url);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("No se pudo copiar. Probá de nuevo.");
    }
  }

  async function revoke(invitationId: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/v1/households/${householdId}/invitations/${invitationId}`, {
        method: "DELETE",
      });
      setConfirmRevoke(null);
      if (invitation?.id === invitationId) setInvitation(null);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/v1/households/${householdId}/members/${userId}`, {
        method: "DELETE",
      });
      setConfirmRemove(null);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const owner = household?.role === "OWNER";

  return (
    <Shell onLogout={() => void logout()}>
      {loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {household ? (
        <>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-primary">
              {owner ? "Administrás este hogar" : "Formás parte de este hogar"}
            </p>
            <h1 className="font-display text-4xl tracking-tight text-balance">
              {household.name}
            </h1>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-2xl">Integrantes</h2>
            {household.members.length === 1 ? (
              <p className="text-sm leading-6 text-text-muted">
                Todavía no hay nadie más.
              </p>
            ) : null}
            <ul className="space-y-2">
              {household.members.map((member) => (
                <li
                  key={member.userId}
                  className="rounded-card border border-border bg-surface px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{member.displayName}</p>
                      <p className="text-sm text-text-muted">{roleLabel(member.role)}</p>
                    </div>
                    {owner && member.role !== "OWNER" ? (
                      <button
                        type="button"
                        className={buttonClass("ghost")}
                        onClick={() => setConfirmRemove(member.userId)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                  {confirmRemove === member.userId ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm">¿Quitás a {member.displayName} del hogar?</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(member.userId)}
                        >
                          Quitar
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setConfirmRemove(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {owner ? (
            <section className="space-y-3">
              <h2 className="font-display text-2xl">Invitar</h2>
              <p className="text-sm leading-6 text-text-muted">
                Compartilo con alguien de tu casa.
              </p>
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => void createInvitation()}
              >
                {busy ? "Creando…" : "Crear enlace"}
              </Button>
              {invitation ? (
                <div className="space-y-3 rounded-card border border-border bg-surface p-3">
                  <p className="text-sm font-semibold">Listo para compartir</p>
                  <p className="truncate text-sm text-text-muted">{invitation.url}</p>
                  <p className="text-sm text-text-muted">
                    Vence el {formatWhen(invitation.expiresAt)}.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => void copyLink()}
                  >
                    Copiar enlace
                  </Button>
                  {copied ? <Alert tone="success">Enlace copiado.</Alert> : null}
                </div>
              ) : null}
              {household.invitations.length > 0 ? (
                <ul className="space-y-2">
                  {household.invitations.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-card border border-border bg-surface px-3 py-3"
                    >
                      <p className="text-sm">
                        Pendiente hasta el {formatWhen(item.expiresAt)}.
                      </p>
                      {confirmRevoke === item.id ? (
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void revoke(item.id)}
                          >
                            Revocar
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setConfirmRevoke(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`${buttonClass("ghost")} mt-2`}
                          onClick={() => setConfirmRevoke(item.id)}
                        >
                          Revocar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </>
      ) : error ? (
        <WayHome />
      ) : null}
    </Shell>
  );
}
