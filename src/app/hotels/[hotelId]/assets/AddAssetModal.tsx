"use client";

import { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";

interface AddAssetModalProps {
  hotelId: string;
  onClose: () => void;
  onAssetAdded: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = ["Bedrooms", "HVAC", "Plantroom", "Lifts", "Fire safety", "Kitchen", "Bathrooms", "IT / AV", "Living", "Electrical", "Plumbing", "Security"];
const STATUSES = ["Active", "Out of service", "Removed", "Planned"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Unknown"];

export default function AddAssetModal({ hotelId, onClose, onAssetAdded }: AddAssetModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    asset_code: "",
    hotel_id: hotelId,
    location: "",
    category: "",
    subcategory: "",
    description: "",
    quantity: 1,
    manufacturer: "",
    model: "",
    serial_number: "",
    capacity: "",
    voltage_phase: "",
    supplier: "",
    installation_date: "",
    purchase_cost: "",
    installation_cost: "",
    capex_or_opex: "CAPEX",
    expected_lifespan_years: "",
    warranty_start: "",
    warranty_end: "",
    warranty_notes: "",
    maintenance_contractor: "",
    maintenance_frequency: "",
    statutory_requirement: false,
    statutory_standard: "",
    condition: "Unknown",
    status: "Active",
    created_by: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asset_code) {
      setErrorMessage("Asset code is required");
      return;
    }

    if (!API_BASE) {
      setErrorMessage("API URL not configured");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Prepare data for API
      const apiData: any = {
        ...formData,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        installation_cost: formData.installation_cost ? parseFloat(formData.installation_cost) : null,
        expected_lifespan_years: formData.expected_lifespan_years ? parseInt(formData.expected_lifespan_years) : null,
        installation_date: formData.installation_date || null,
        warranty_start: formData.warranty_start || null,
        warranty_end: formData.warranty_end || null,
      };

      // Remove empty strings
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === "") {
          apiData[key] = null;
        }
      });

      const response = await fetch(`${API_BASE}/assets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create asset");
      }

      onAssetAdded();
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create asset");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Asset</h2>
              <p className="text-sm text-gray-500 mt-1">Create a single asset record</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Code *
                  </label>
                  <input
                    type="text"
                    value={formData.asset_code}
                    onChange={(e) => updateField("asset_code", e.target.value)}
                    placeholder="e.g., HIE-DUB-RM101-TV"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="e.g., Room 101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => updateField("subcategory", e.target.value)}
                    placeholder="e.g., Television"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => updateField("condition", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={2}
                    placeholder="Brief description of the asset"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Technical Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => updateField("manufacturer", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => updateField("serial_number", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => updateField("supplier", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => updateField("capacity", e.target.value)}
                    placeholder="e.g., 50kW, 500L"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voltage / Phase
                  </label>
                  <input
                    type="text"
                    value={formData.voltage_phase}
                    onChange={(e) => updateField("voltage_phase", e.target.value)}
                    placeholder="e.g., 230V 1ph"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Cost (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => updateField("purchase_cost", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Cost (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.installation_cost}
                    onChange={(e) => updateField("installation_cost", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CapEx / OpEx
                  </label>
                  <select
                    value={formData.capex_or_opex}
                    onChange={(e) => updateField("capex_or_opex", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CAPEX">CapEx</option>
                    <option value="OPEX">OpEx</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Lifespan (years)
                  </label>
                  <input
                    type="number"
                    value={formData.expected_lifespan_years}
                    onChange={(e) => updateField("expected_lifespan_years", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) => updateField("installation_date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Maintenance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Contractor
                  </label>
                  <input
                    type="text"
                    value={formData.maintenance_contractor}
                    onChange={(e) => updateField("maintenance_contractor", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Frequency
                  </label>
                  <input
                    type="text"
                    value={formData.maintenance_frequency}
                    onChange={(e) => updateField("maintenance_frequency", e.target.value)}
                    placeholder="e.g., Monthly, Annual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.statutory_requirement}
                      onChange={(e) => updateField("statutory_requirement", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>Statutory Requirement</span>
                  </label>
                  {formData.statutory_requirement && (
                    <input
                      type="text"
                      value={formData.statutory_standard}
                      onChange={(e) => updateField("statutory_standard", e.target.value)}
                      placeholder="e.g., IS 3217, EN 12101"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Warranty</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Start
                  </label>
                  <input
                    type="date"
                    value={formData.warranty_start}
                    onChange={(e) => updateField("warranty_start", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty End
                  </label>
                  <input
                    type="date"
                    value={formData.warranty_end}
                    onChange={(e) => updateField("warranty_end", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Notes
                  </label>
                  <textarea
                    value={formData.warranty_notes}
                    onChange={(e) => updateField("warranty_notes", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSaving ? "Creating..." : "Create Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}
