// All money is stored/handled as integer cents. All percentages are integer
// basis points of a percent (1% = 100bp; 100% = 10000bp). Never let a float
// cross a function boundary here — round once, at the edge, with Math.round.

export function centsToBp(numeratorCents: number, denominatorCents: number): number {
  if (denominatorCents === 0) return 0;
  return Math.round((numeratorCents / denominatorCents) * 10000);
}

export function applyBp(amountCents: number, bp: number): number {
  return Math.round((amountCents * bp) / 10000);
}

export function bpToPercentString(bp: number, fractionDigits = 1): string {
  return (bp / 100).toFixed(fractionDigits);
}
