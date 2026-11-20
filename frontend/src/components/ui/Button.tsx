import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-brand-primary bg-brand-primary text-white hover:border-brand-primary-hover hover:bg-brand-primary-hover",
  secondary:
    "border border-text/35 bg-surface text-text hover:border-brand-primary hover:bg-brand-accent/55",
  ghost:
    "border border-text/25 bg-surface text-text hover:border-text/45 hover:bg-surface-subtle",
  danger:
    "border border-danger/45 bg-surface text-danger hover:border-danger hover:bg-danger/10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
}

export function iconButtonClass(className = "") {
  return `grid size-11 place-items-center rounded-card border border-text/35 bg-surface text-text transition-colors hover:border-brand-primary hover:bg-brand-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-40 ${className}`;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
