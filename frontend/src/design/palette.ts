export type PaletteEntry = {
  name: string;
  token: string;
  hex: string;
  swatchClass: string;
  textClass: string;
};

export const brandPalette: PaletteEntry[] = [
  {
    name: "Tomato",
    token: "--color-brand-primary",
    hex: "#B94735",
    swatchClass: "bg-brand-primary",
    textClass: "text-white",
  },
  {
    name: "Tomato hover",
    token: "--color-brand-primary-hover",
    hex: "#9E3D2F",
    swatchClass: "bg-brand-primary-hover",
    textClass: "text-white",
  },
  {
    name: "Butter",
    token: "--color-brand-accent",
    hex: "#F0D58A",
    swatchClass: "bg-brand-accent",
    textClass: "text-text",
  },
  {
    name: "Peach",
    token: "--color-brand-warm",
    hex: "#DDAE99",
    swatchClass: "bg-brand-warm",
    textClass: "text-text",
  },
  {
    name: "Cream",
    token: "--color-background",
    hex: "#FFF7E9",
    swatchClass: "bg-background",
    textClass: "text-text",
  },
  {
    name: "Surface",
    token: "--color-surface",
    hex: "#FFFFFF",
    swatchClass: "bg-surface",
    textClass: "text-text",
  },
  {
    name: "Surface subtle",
    token: "--color-surface-subtle",
    hex: "#FBF3E8",
    swatchClass: "bg-surface-subtle",
    textClass: "text-text",
  },
  {
    name: "Espresso",
    token: "--color-text",
    hex: "#453B35",
    swatchClass: "bg-text",
    textClass: "text-white",
  },
  {
    name: "Muted",
    token: "--color-text-muted",
    hex: "#756A62",
    swatchClass: "bg-text-muted",
    textClass: "text-white",
  },
  {
    name: "Border",
    token: "--color-border",
    hex: "#E9DED1",
    swatchClass: "bg-border",
    textClass: "text-text",
  },
];

export const statusPalette: PaletteEntry[] = [
  {
    name: "Success",
    token: "--color-success",
    hex: "#39785A",
    swatchClass: "bg-success",
    textClass: "text-white",
  },
  {
    name: "Warning",
    token: "--color-warning",
    hex: "#9A681C",
    swatchClass: "bg-warning",
    textClass: "text-white",
  },
  {
    name: "Danger",
    token: "--color-danger",
    hex: "#B33E32",
    swatchClass: "bg-danger",
    textClass: "text-white",
  },
];
