import type { ReactNode } from "react";
import Link from "next/link";

const styles = {
  primary: "bg-brand-primary text-white hover:bg-brand-primary-hover",
  secondary: "border border-border bg-surface text-text hover:bg-surface-subtle",
  ghost: "bg-transparent text-text hover:bg-surface-subtle",
};

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof styles;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-card px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
