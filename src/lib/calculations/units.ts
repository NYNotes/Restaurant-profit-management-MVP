// Unit conversion. Money-safe: all quantities are plain numbers (not cents),
// but conversions only ever multiply by fixed rational factors, so precision
// loss is negligible compared to money math (which stays integer elsewhere).

export type UnitDimension = "WEIGHT" | "VOLUME" | "COUNT";

export const UNIT_DIMENSION: Record<string, UnitDimension> = {
  LB: "WEIGHT",
  OZ: "WEIGHT",
  KG: "WEIGHT",
  G: "WEIGHT",
  GALLON: "VOLUME",
  QUART: "VOLUME",
  PINT: "VOLUME",
  CUP: "VOLUME",
  FL_OZ: "VOLUME",
  L: "VOLUME",
  ML: "VOLUME",
  EACH: "COUNT",
  CASE: "COUNT",
  PACK: "COUNT",
};

// Canonical base per dimension: grams for weight, milliliters for volume, each for count.
const TO_BASE: Record<string, number> = {
  LB: 453.59237,
  OZ: 28.349523125,
  KG: 1000,
  G: 1,
  GALLON: 3785.411784,
  QUART: 946.352946,
  PINT: 473.176473,
  CUP: 236.5882365,
  FL_OZ: 29.5735295625,
  L: 1000,
  ML: 1,
  EACH: 1,
  CASE: 1,
  PACK: 1,
};

export class IncompatibleUnitsError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot convert between ${from} and ${to}: different unit dimensions`);
    this.name = "IncompatibleUnitsError";
  }
}

export function convertUnits(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const fromDim = UNIT_DIMENSION[fromUnit];
  const toDim = UNIT_DIMENSION[toUnit];
  if (!fromDim || !toDim || fromDim !== toDim) {
    throw new IncompatibleUnitsError(fromUnit, toUnit);
  }
  const baseQty = quantity * TO_BASE[fromUnit];
  return baseQty / TO_BASE[toUnit];
}

export function unitDimension(unit: string): UnitDimension {
  return UNIT_DIMENSION[unit];
}
