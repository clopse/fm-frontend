// utils/mapParsedCharges.ts

type ParsedCharge = {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
};

type ParsedData = {
  charges: ParsedCharge[];
  taxDetails: any;
  totalAmount: any;
  billingPeriod: any;
  meterDetails: any;
};

function getCharge(charges: ParsedCharge[], key: string): ParsedCharge | undefined {
  return charges.find(c => c.description.toLowerCase().includes(key));
}

export function mapParsedChargesToFormFields(parsed: ParsedData) {
  const charges = parsed.charges || [];

  const day = getCharge(charges, "day units");
  const night = getCharge(charges, "night units");
  const capacity = getCharge(charges, "capacity charge");
  const pso = getCharge(charges, "pso");
  const standing = getCharge(charges, "standing charge");

  return {
    billing_start: parsed.billingPeriod?.startDate || "",
    billing_end: parsed.billingPeriod?.endDate || "",

    day_kwh: String(day?.quantity || ""),
    night_kwh: String(night?.quantity || ""),
    mic: String(parsed.meterDetails?.mic?.value || ""),

    day_rate: String(day?.rate || ""),
    night_rate: String(night?.rate || ""),
    day_total: String(day?.total || ""),
    night_total: String(night?.total || ""),

    capacity_charge: String(capacity?.total || ""),
    pso_levy: String(pso?.total || ""),
    electricity_tax: String(parsed.taxDetails?.electricityTax?.amount || ""),
    vat: String(parsed.taxDetails?.vatAmount || ""),
    total_amount: String(parsed.totalAmount?.value || ""),
  };
}
