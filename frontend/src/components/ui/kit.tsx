import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const control =
  "min-h-11 w-full rounded-card border border-border bg-surface px-3 text-base text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary";

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement<Record<string, unknown>>;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : children;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${control} ${className}`} {...props} />;
}

export function SelectInput({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${control} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${control} min-h-24 py-2 ${className}`} {...props} />;
}

export function selectableClass(
  active: boolean,
  options?: { shape?: "pill" | "card"; block?: boolean },
) {
  const shape = options?.shape ?? "pill";
  const radius = shape === "pill" ? "rounded-full" : "rounded-card";
  const layout = options?.block
    ? "flex w-full justify-start text-left"
    : "inline-flex justify-center";
  const state = active
    ? "border-brand-primary bg-brand-accent text-text"
    : "border-text/35 bg-surface text-text hover:border-brand-primary hover:bg-brand-accent/45";
  return `${layout} min-h-11 shrink-0 items-center gap-2 border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${radius} ${state}`;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-[0_1px_2px_rgba(69,59,53,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  if (!onClick) {
    return (
      <span className="inline-flex min-h-8 items-center rounded-full bg-brand-accent px-3 text-sm font-semibold text-text">
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={selectableClass(active)}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "warning" | "danger" | "info";
  children: ReactNode;
}) {
  const tones = {
    warning: "border-warning text-warning",
    danger: "border-danger text-danger",
    info: "border-border text-text",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-card border bg-surface px-3 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <Card className="space-y-3 px-4 py-8 text-center">
      <h2 className="font-display text-2xl text-text">{title}</h2>
      <p className="text-sm leading-6 text-text-muted">{text}</p>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </Card>
  );
}
