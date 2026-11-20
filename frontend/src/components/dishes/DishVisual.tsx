import { DISH_CATEGORY_LABELS } from "@/domain/labels";
import type { DishCategory } from "@/domain/types";
import { Icon } from "@/components/ui/Icon";

const tint: Record<DishCategory, string> = {
  PASTAS: "bg-brand-accent/70",
  TARTAS_Y_EMPANADAS: "bg-brand-warm/70",
  CARNES: "bg-brand-primary/15",
  POLLO: "bg-brand-warm/80",
  PESCADOS: "bg-brand-accent/40",
  ENSALADAS: "bg-brand-warm/40",
  VERDURAS: "bg-brand-accent/50",
  ARROCES_Y_CEREALES: "bg-brand-warm/55",
  SOPAS_Y_GUISOS: "bg-brand-primary/10",
  SANDWICHES: "bg-brand-accent/60",
  OTROS: "bg-surface-subtle",
};

export function DishVisual({
  title,
  category,
  imageDataUrl,
  className = "",
}: {
  title: string;
  category: DishCategory;
  imageDataUrl: string | null;
  className?: string;
}) {
  if (imageDataUrl) {
    return (
      // La foto la elige el hogar; no pasa por el optimizador de imágenes.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageDataUrl} alt="" className={`object-cover ${className}`} />
    );
  }
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-text ${tint[category]} ${className}`}
    >
      <Icon name="plate" className="size-8" />
      <span className="px-2 text-center text-xs font-semibold">
        {DISH_CATEGORY_LABELS[category]}
      </span>
      <span className="sr-only">{title}</span>
    </div>
  );
}
