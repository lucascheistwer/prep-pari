export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { code?: string; message?: string }) : null;
  if (!response.ok) {
    throw new ApiError(
      payload?.code ?? "INTERNAL_ERROR",
      payload?.message ?? "Ocurrió un error inesperado.",
    );
  }
  return payload as T;
}

const friendlyErrors: Record<string, string> = {
  INVALID_IDENTITY_TOKEN: "No pudimos entrar con Google. Intentá de nuevo.",
  EMAIL_NOT_VERIFIED: "No pudimos usar esa cuenta de Google.",
  AUTH_PROVIDER_NOT_CONFIGURED: "Ahora no se puede entrar con Google.",
  AUTH_PROVIDER_UNAVAILABLE: "No pudimos entrar con Google. Intentá de nuevo.",
  DEV_LOGIN_DISABLED: "No pudimos entrar. Probá con Google.",
  UNAUTHENTICATED: "Tenés que entrar para seguir.",
  VALIDATION_ERROR: "Revisá lo que escribiste.",
  INTERNAL_ERROR: "Algo salió mal. Intentá de nuevo.",
  ALREADY_HAS_HOUSEHOLD: "Ya formás parte de un hogar.",
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return friendlyErrors[error.code] ?? error.message;
  }
  return "No pudimos conectar. Intentá de nuevo.";
}

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string;
};

export type HouseholdSummary = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
};

export type Me = SessionUser & {
  households: HouseholdSummary[];
};

export type AuthConfig = {
  googleClientId: string | null;
  devLoginEnabled: boolean;
};

export type Member = {
  userId: string;
  displayName: string;
  email: string | null;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
};

export type PendingInvitation = {
  id: string;
  expiresAt: string;
  createdAt: string;
};

export type Household = {
  id: string;
  name: string;
  timezone: string;
  role: "OWNER" | "MEMBER";
  members: Member[];
  invitations: PendingInvitation[];
};

export type CreatedInvitation = {
  id: string;
  expiresAt: string;
  url: string;
};

export type InvitationPreview = {
  householdId: string;
  householdName: string;
  inviterName: string;
  expiresAt: string;
  alreadyMember: boolean;
};

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(new Date(iso))
    .replace(/\.$/, "");
}

export function roleLabel(role: "OWNER" | "MEMBER") {
  return role === "OWNER" ? "Administra" : "Integrante";
}
