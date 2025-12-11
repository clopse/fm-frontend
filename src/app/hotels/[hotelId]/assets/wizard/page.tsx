// src/app/hotels/[hotelId]/assets/wizard/page.tsx
"use client";

import { useState } from "react";

type AssetCreate = {
  asset_code: string;
  hotel_id: string;
  location?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  quantity?: number;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
  voltage_phase?: string;
  supplier?: string;
  installation_date?: string;
  purchase_cost?: number;
  installation_cost?: number;
  capex_or_opex?: string;
  expected_lifespan_years?: number;
  warranty_start?: string;
  warranty_end?: string;
  warranty_notes?: string;
  maintenance_contractor?: string;
  maintenance_frequency?: string;
  last_service_date?: string;
  next_service_date?: string;
  service_contract_reference?: string;
  statutory_requirement?: boolean;
  statutory_standard?: string;
  condition?: string;
  status?: string;
  fault_notes?: string;
  last_inspection?: string;
  om_manual_path?: string;
  commissioning_cert_path?: string;
  warranty_doc_path?: string;
  photos_path?: string;
  created_by?: string;
};

const steps = ["Basic info", "Technical", "Cost & warranty", "Maintenance & notes"];

interface Props {
  params: { hotelId: string };
}

export default function AssetWizardPage({ params }: Props) {
  const hotelId = params.hotelId;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<AssetCreate>({
    asset_code: "",
    hotel_id: hotelId,
    quantity: 1,
    statutory_requirement: false,
  });

  function updateField<K extends keyof AssetCreate>(key: K, value: AssetCreate[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function nextStep() {
    setStep(s => Math.min(s + 1, steps.length - 1));
  }

  function prevStep() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: AssetCreate = {
        ...form,
        // ensure numbers are numbers, not empty strings
        quantity: form.quantity ? Number(form.quantity) : 1,
        purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : undefined,
        installation_cost: form.installation_cost ? Number(form.installation_cost) : undefined,
        expected_lifespan_years: form.expected_lifespan_years
          ? Number(form.expected_lifespan_years)
          : undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Request failed with status ${res.status}`);
      }

      setSuccess("Asset saved successfully.");
    } catch (e: any) {
      setError(e.message || "Failed to save asset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl mb-2">Asset wizard</h1>
      <p className="text-sm text-gray-600">
        Hotel: {hotelId}
      </p>

      <div className="flex items-center gap-2 text-sm">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center">
            <div
              className={`rounded-full w-7 h-7 flex items-center justify-center border text-xs ${
                index === step
                  ? "bg-gray-900 text-white"
                  : index < step
                  ? "bg-gray-200 text-gray-900"
                  : "bg-white text-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 mr-4 text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      <div className="border rounded-md p-4 space-y-4 bg-white">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Asset code</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.asset_code}
                onChange={e => updateField("asset_code", e.target.value)}
                placeholder="HIEX-HVAC-VRV-0032"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Location</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.location ?? ""}
                onChange={e => updateField("location", e.target.value)}
                placeholder="Room 237"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Category</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.category ?? ""}
                  onChange={e => updateField("category", e.target.value)}
                  placeholder="HVAC"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Subcategory</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.subcategory ?? ""}
                  onChange={e => updateField("subcategory", e.target.value)}
                  placeholder="VRF indoor unit"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
                value={form.description ?? ""}
                onChange={e => updateField("description", e.target.value)}
                placeholder="Daikin VRV indoor fan coil serving Room 237"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Quantity</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.quantity ?? 1}
                onChange={e => updateField("quantity", Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Manufacturer</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.manufacturer ?? ""}
                  onChange={e => updateField("manufacturer", e.target.value)}
                  placeholder="Daikin"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Model</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.model ?? ""}
                  onChange={e => updateField("model", e.target.value)}
                  placeholder="FXDQ25A"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Serial number</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.serial_number ?? ""}
                  onChange={e => updateField("serial_number", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Capacity</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.capacity ?? ""}
                  onChange={e => updateField("capacity", e.target.value)}
                  placeholder="2.5 kW"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Voltage / phase</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.voltage_phase ?? ""}
                onChange={e => updateField("voltage_phase", e.target.value)}
                placeholder="230V"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Supplier</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.supplier ?? ""}
                  onChange={e => updateField("supplier", e.target.value)}
                  placeholder="Crystal Air"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Installation date</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.installation_date ?? ""}
                  onChange={e => updateField("installation_date", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Purchase cost</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.purchase_cost ?? ""}
                  onChange={e => updateField("purchase_cost", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Installation cost</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.installation_cost ?? ""}
                  onChange={e => updateField("installation_cost", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Capex or opex</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.capex_or_opex ?? ""}
                  onChange={e => updateField("capex_or_opex", e.target.value)}
                  placeholder="CAPEX"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Expected lifespan years</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.expected_lifespan_years ?? ""}
                  onChange={e =>
                    updateField("expected_lifespan_years", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Warranty start</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.warranty_start ?? ""}
                  onChange={e => updateField("warranty_start", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Warranty end</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.warranty_end ?? ""}
                  onChange={e => updateField("warranty_end", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Warranty notes</label>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
                value={form.warranty_notes ?? ""}
                onChange={e => updateField("warranty_notes", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="statutory_requirement"
                type="checkbox"
                className="h-4 w-4"
                checked={form.statutory_requirement ?? false}
                onChange={e => updateField("statutory_requirement", e.target.checked)}
              />
              <label htmlFor="statutory_requirement" className="text-sm">
                Statutory requirement
              </label>
            </div>

            <div>
              <label className="block text-sm mb-1">Statutory standard</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.statutory_standard ?? ""}
                onChange={e => updateField("statutory_standard", e.target.value)}
                placeholder="EN378, I.S.3218 etc"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Condition</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.condition ?? ""}
                  onChange={e => updateField("condition", e.target.value)}
                  placeholder="Good, fair, poor"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.status ?? ""}
                  onChange={e => updateField("status", e.target.value)}
                  placeholder="Active, out of service"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Fault notes</label>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
                value={form.fault_notes ?? ""}
                onChange={e => updateField("fault_notes", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Last inspection</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.last_inspection ?? ""}
                onChange={e => updateField("last_inspection", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Created by</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.created_by ?? ""}
                onChange={e => updateField("created_by", e.target.value)}
                placeholder="dhurley"
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 0}
          className="px-4 py-2 border rounded text-sm disabled:opacity-50"
        >
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save asset"}
          </button>
        )}
      </div>
    </div>
  );
}
