import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-brand-primary text-white hover:bg-brand-primary-hover",
  secondary: "border border-border bg-surface text-text hover:bg-surface-subtle",
  ghost: "bg-transparent text-text hover:bg-surface-subtle",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function buttonClass(variant: Variant = "primary", className = "") {
  return `inline-flex min-h-11 items-center justify-center rounded-card px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
