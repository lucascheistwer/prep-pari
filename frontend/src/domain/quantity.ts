import type { UnitCode } from "@/domain/types";

const SCALE = BigInt(1000);
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const FIVE = BigInt(5);
const TEN = BigInt(10);
const THOUSAND = BigInt(1000);

const UNIT_ALIASES: Record<string, UnitCode> = {
  g: "g",
  gr: "g",
  gramo: "g",
  gramos: "g",
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogramo: "kg",
  kilogramos: "kg",
  ml: "ml",
  mililitro: "ml",
  mililitros: "ml",
  l: "l",
  lt: "l",
  litro: "l",
  litros: "l",
  unit: "unit",
  unidad: "unit",
  unidades: "unit",
  un: "unit",
  u: "unit",
  tbsp: "tbsp",
  cucharada: "tbsp",
  cucharadas: "tbsp",
  cda: "tbsp",
  tsp: "tsp",
  cucharadita: "tsp",
  cucharaditas: "tsp",
  cdta: "tsp",
  cup: "cup",
  taza: "cup",
  tazas: "cup",
  to_taste: "to_taste",
  "a gusto": "to_taste",
};

export function parseUnit(value: string): UnitCode | null {
  const key = value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  return UNIT_ALIASES[key] ?? null;
}

export function parseQuantity(input: string): bigint | null {
  const trimmed = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (!whole || whole.length > 5) {
    return null;
  }
  const padded = (frac + "000").slice(0, 3);
  const roundUp = frac[3] !== undefined && frac[3] >= "5";
  let value = BigInt(whole) * SCALE + BigInt(padded);
  if (roundUp) {
    value += ONE;
  }
  return value;
}

export function quantityToString(value: bigint) {
  const whole = value / SCALE;
  const frac = (value % SCALE).toString().padStart(3, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function scaleQuantity(
  value: bigint,
  baseServings: number,
  plannedServings: number,
) {
  if (
    !Number.isInteger(baseServings) ||
    !Number.isInteger(plannedServings) ||
    baseServings < 1 ||
    plannedServings < 1
  ) {
    throw new Error("Porciones inválidas");
  }
  const product = value * BigInt(plannedServings);
  const divisor = BigInt(baseServings);
  const quotient = product / divisor;
  const remainder = product % divisor;
  return remainder * TWO >= divisor ? quotient + ONE : quotient;
}

export function toCanonical(quantity: bigint, unit: UnitCode) {
  if (unit === "to_taste") {
    return null;
  }
  if (unit === "kg") {
    return { quantity: quantity * THOUSAND, unit: "g" as const };
  }
  if (unit === "l") {
    return { quantity: quantity * THOUSAND, unit: "ml" as const };
  }
  return { quantity, unit };
}

function roundDisplay(value: bigint) {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const remainder = abs % TEN;
  const base = abs - remainder;
  const rounded = remainder >= FIVE ? base + TEN : base;
  return negative ? -rounded : rounded;
}

function formatNumber(value: bigint) {
  const negative = value < ZERO;
  const rounded = roundDisplay(negative ? -value : value);
  const whole = rounded / SCALE;
  const hundredths = (rounded % SCALE) / TEN;
  const frac = hundredths.toString().padStart(2, "0").replace(/0+$/, "");
  const body = frac ? `${whole},${frac}` : whole.toString();
  return negative ? `-${body}` : body;
}

export function formatCanonical(quantity: bigint, unit: UnitCode) {
  if (unit === "g") {
    if (quantity >= THOUSAND * SCALE) {
      return `${formatNumber(quantity / THOUSAND)} kg`;
    }
    return `${formatNumber(quantity)} g`;
  }
  if (unit === "ml") {
    if (quantity >= THOUSAND * SCALE) {
      return `${formatNumber(quantity / THOUSAND)} l`;
    }
    return `${formatNumber(quantity)} ml`;
  }
  if (unit === "unit") {
    const label = quantity === SCALE ? "unidad" : "unidades";
    return `${formatNumber(quantity)} ${label}`;
  }
  const words: Partial<Record<UnitCode, [string, string]>> = {
    tbsp: ["cucharada", "cucharadas"],
    tsp: ["cucharadita", "cucharaditas"],
    cup: ["taza", "tazas"],
  };
  const pair = words[unit];
  if (!pair) {
    return formatNumber(quantity);
  }
  return `${formatNumber(quantity)} ${quantity === SCALE ? pair[0] : pair[1]}`;
}

export function formatAmount(quantity: string | null, unit: UnitCode | null) {
  if (unit === "to_taste") {
    return "A gusto";
  }
  if (quantity == null || unit == null) {
    return "Cantidad a definir";
  }
  const parsed = parseQuantity(quantity);
  if (parsed == null) {
    return "Cantidad a definir";
  }
  const canonical = toCanonical(parsed, unit);
  if (!canonical) {
    return "A gusto";
  }
  return formatCanonical(canonical.quantity, canonical.unit);
}
