import type { PaletteEntry } from "@/design/palette";

export function ColorSwatch({ name, token, hex, swatchClass, textClass }: PaletteEntry) {
  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface">
      <div className={`flex h-16 items-end px-3 py-2 ${swatchClass} ${textClass}`}>
        <p className="text-sm font-semibold">{name}</p>
      </div>
      <div className="space-y-1 px-3 py-2">
        <p className="font-mono text-xs text-text">{hex}</p>
        <p className="font-mono text-[11px] leading-snug text-text-muted">
          {token.replaceAll("-", "-\u200b")}
        </p>
      </div>
    </article>
  );
}
