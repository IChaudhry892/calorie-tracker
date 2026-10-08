// Imperial ↔ metric conversions. Everything is stored in cm/kg; these run only at the form edges.

export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;

export function ftInToCm(ft: number, inches: number): number {
  return (ft * 12 + inches) * CM_PER_IN;
}

/** Whole inches, carrying 12″ into the next foot (182.88 cm → 6′0″, not 5′12″). */
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(totalInches / 12), in: totalInches % 12 };
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

/** Pounds to one decimal, without a trailing ".0" (176.37 → "176.4", 176 → "176"). */
export function formatLb(lb: number): string {
  return Number(lb.toFixed(1)).toString();
}
