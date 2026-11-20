const ALIASES: Record<string, string> = {
  papa: "papa",
  papas: "papa",
  huevo: "huevo",
  huevos: "huevo",
  cebolla: "cebolla",
  cebollas: "cebolla",
  "cebolla de verdeo": "cebolla de verdeo",
  "cebollas de verdeo": "cebolla de verdeo",
  zanahoria: "zanahoria",
  zanahorias: "zanahoria",
  tomate: "tomate",
  tomates: "tomate",
  morron: "morron",
  morrones: "morron",
  lenteja: "lenteja",
  lentejas: "lenteja",
  ajo: "ajo",
  ajos: "ajo",
  lechuga: "lechuga",
  lechugas: "lechuga",
  limon: "limon",
  limones: "limon",
  acelga: "acelga",
  acelgas: "acelga",
  espinaca: "espinaca",
  espinacas: "espinaca",
  "pan rallado": "pan rallado",
  "tapa de tarta": "tapa de tarta",
  "tapas de tarta": "tapa de tarta",
  "harina 0000": "harina 0000",
  nalga: "nalga",
  pollo: "pollo",
  aceite: "aceite",
  sal: "sal",
  leche: "leche",
  "queso rallado": "queso rallado",
  romero: "romero",
  pan: "pan",
  panes: "pan",
  milanesa: "milanesa",
  milanesas: "milanesa",
  "chorizo colorado": "chorizo colorado",
  pimenton: "pimenton",
  yogur: "yogur",
  "papel higienico": "papel higienico",
};

export function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function catalogMatch(folded: string) {
  if (ALIASES[folded]) {
    return ALIASES[folded];
  }
  if (folded.endsWith("es")) {
    const stem = folded.slice(0, -2);
    if (ALIASES[stem]) {
      return ALIASES[stem];
    }
  }
  if (folded.endsWith("s")) {
    const stem = folded.slice(0, -1);
    if (ALIASES[stem]) {
      return ALIASES[stem];
    }
  }
  return null;
}

export function normalizeIngredientName(value: string) {
  const folded = foldText(value);
  const direct = catalogMatch(folded);
  if (direct) {
    return direct;
  }
  const parts = folded.split(" ");
  if (parts.length > 1) {
    const first = catalogMatch(parts[0] ?? "");
    if (first) {
      const rebuilt = [first, ...parts.slice(1)].join(" ");
      return ALIASES[rebuilt] ?? rebuilt;
    }
  }
  return folded;
}
