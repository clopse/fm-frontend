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

export function mapParsedChargesToFormFields(parsed: ParsedData) {
  const charges = parsed.charges || [];

  const get = (key: string, field: keyof ParsedCharge) => {
    const found = charges.find(c => c.description.toLowerCase().includes(key));
    return found ? found[field] : "";
  };

  return {
    billing_start: parsed.billingPeriod?.startDate || "",
    billing_end: parsed.billingPeriod?.endDate || "",

    day_kwh: get("day", "quantity"),
    night_kwh: get("night", "quantity"),
    mic: parsed.meterDetails?.mic?.value || "",

    day_rate: get("day", "rate"),
    night_rate: get("night", "rate"),
    day_total: get("day", "total"),
    night_total: get("night", "total"),

    capacity_charge: get("capacity", "total"),
    pso_levy: get("pso", "total"),
    electricity_tax: parsed.taxDetails?.electricityTax || "",
    vat: parsed.taxDetails?.vatAmount || "",
    total_amount: parsed.totalAmount?.value || "",
  };
}
