import { describe, it, expect } from "vitest";
import { convertUnits, IncompatibleUnitsError } from "./units";

describe("convertUnits", () => {
  it("converts within weight (kg -> g)", () => {
    expect(convertUnits(1, "KG", "G")).toBeCloseTo(1000);
  });

  it("converts within volume (gallon -> fl oz)", () => {
    expect(convertUnits(1, "GALLON", "FL_OZ")).toBeCloseTo(128, 0);
  });

  it("is a no-op for identical units", () => {
    expect(convertUnits(5, "LB", "LB")).toBe(5);
  });

  it("throws when converting across incompatible dimensions", () => {
    expect(() => convertUnits(1, "LB", "ML")).toThrow(IncompatibleUnitsError);
  });

  it("throws when converting count to weight", () => {
    expect(() => convertUnits(1, "EACH", "G")).toThrow(IncompatibleUnitsError);
  });
});
