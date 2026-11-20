export function Stepper({
  value,
  min = 1,
  max = 30,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-card border border-text/35 bg-surface text-lg font-semibold text-text transition-colors hover:border-brand-primary hover:bg-brand-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-40"
        aria-label={`Menos ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span
        className="min-w-10 text-center text-base font-semibold tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-card border border-text/35 bg-surface text-lg font-semibold text-text transition-colors hover:border-brand-primary hover:bg-brand-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-40"
        aria-label={`Más ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
