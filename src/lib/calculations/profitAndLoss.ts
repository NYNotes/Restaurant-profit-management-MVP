import { centsToBp } from "./money";

export interface FinancialMonthInput {
  revenueCents: number;
  foodCostCents: number;
  laborCostCents: number;
  rentCents: number;
  utilitiesCents: number;
  creditCardFeesCents: number;
  deliveryFeesCents: number;
  insuranceCents: number;
  marketingCents: number;
  repairsCents: number;
  otherExpensesCents: number;
}

export interface ProfitAndLossLine {
  amountCents: number;
  percentOfSalesBp: number;
}

export interface ProfitAndLossResult {
  revenue: ProfitAndLossLine;
  foodCost: ProfitAndLossLine;
  laborCost: ProfitAndLossLine;
  grossProfit: ProfitAndLossLine;
  primeCost: ProfitAndLossLine;
  operatingExpenses: ProfitAndLossLine;
  operatingProfit: ProfitAndLossLine;
  netProfit: ProfitAndLossLine;
}

function line(amountCents: number, revenueCents: number): ProfitAndLossLine {
  return { amountCents, percentOfSalesBp: centsToBp(amountCents, revenueCents) };
}

export function calculateProfitAndLoss(input: FinancialMonthInput): ProfitAndLossResult {
  const { revenueCents, foodCostCents, laborCostCents } = input;

  const operatingExpensesCents =
    input.rentCents +
    input.utilitiesCents +
    input.creditCardFeesCents +
    input.deliveryFeesCents +
    input.insuranceCents +
    input.marketingCents +
    input.repairsCents +
    input.otherExpensesCents;

  const grossProfitCents = revenueCents - foodCostCents;
  const primeCostCents = foodCostCents + laborCostCents;
  const operatingProfitCents = grossProfitCents - laborCostCents - operatingExpensesCents;
  const netProfitCents = operatingProfitCents; // MVP: no separate non-operating items (tax, interest) yet

  return {
    revenue: line(revenueCents, revenueCents),
    foodCost: line(foodCostCents, revenueCents),
    laborCost: line(laborCostCents, revenueCents),
    grossProfit: line(grossProfitCents, revenueCents),
    primeCost: line(primeCostCents, revenueCents),
    operatingExpenses: line(operatingExpensesCents, revenueCents),
    operatingProfit: line(operatingProfitCents, revenueCents),
    netProfit: line(netProfitCents, revenueCents),
  };
}

/** Percentage-point change between two basis-point values, e.g. for "vs last month" comparisons. */
export function bpChange(currentBp: number, previousBp: number): number {
  return currentBp - previousBp;
}

/** Percent change between two cent amounts, expressed in basis points (e.g. +620 = +6.20%). */
export function percentChangeBp(currentCents: number, previousCents: number): number {
  if (previousCents === 0) return 0;
  return Math.round(((currentCents - previousCents) / Math.abs(previousCents)) * 10000);
}
