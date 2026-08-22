export const UNIT_LABEL: Record<string, string> = {
  LB: "lb",
  OZ: "oz",
  KG: "kg",
  G: "g",
  GALLON: "gallon",
  QUART: "quart",
  PINT: "pint",
  CUP: "cup",
  FL_OZ: "fl oz",
  L: "L",
  ML: "ml",
  EACH: "each",
  CASE: "case",
  PACK: "pack",
};

export const UNIT_GROUPS: { label: string; units: string[] }[] = [
  { label: "Weight", units: ["LB", "OZ", "KG", "G"] },
  { label: "Volume", units: ["GALLON", "QUART", "PINT", "CUP", "FL_OZ", "L", "ML"] },
  { label: "Count", units: ["EACH", "CASE", "PACK"] },
];
