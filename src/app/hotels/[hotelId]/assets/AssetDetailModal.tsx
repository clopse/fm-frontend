"use client";

import { X, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import DocumentSection from "./DocumentSection";

interface Asset {
  id: number;
  asset_code: string;
  hotel_id: string;
  location: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  quantity: number;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  status: string | null;
  condition: string | null;
  purchase_cost: number | null;
  expected_lifespan_years: number | null;
  installation_date: string | null;
  warranty_start: string | null;
  warranty_end: string | null;
  warranty_notes: string | null;
  maintenance_contractor: string | null;
  maintenance_frequency: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  service_contract_reference: string | null;
  statutory_requirement: boolean;
  statutory_standard: string | null;
  fault_notes: string | null;
  last_inspection: string | null;
  om_manual_path: string | null;
  commissioning_cert_path: string | null;
  warranty_doc_path: string | null;
  photos_path: string | null;
  capacity: string | null;
  voltage_phase: string | null;
  supplier: string | null;
  installation_cost: number | null;
  capex_or_opex: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  onDelete: (id: number) => void;
}

type TabType = "details" | "technical" | "financial" | "maintenance" | "documents";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AssetDetailModal({
  asset,
  onClose,
  onSave,
  onDelete,
}: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState<Asset>(asset);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedAsset),
      });

      if (!res.ok) throw new Error("Failed to save");

      const updated = await res.json();
      setEditedAsset(updated); // Update local state with fresh data
      onSave(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving asset:", error);
      alert("Failed to save asset");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assets/${asset.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      onDelete(asset.id);
      onClose();
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete asset");
    }
  };

  const updateField = (field: keyof Asset, value: any) => {
    setEditedAsset({ ...editedAsset, [field]: value });
  };

  const calculateAge = () => {
    if (!editedAsset.installation_date) return null;
    const years = new Date().getFullYear() - new Date(editedAsset.installation_date).getFullYear();
    return years;
  };

  const calculateRemainingLife = () => {
    const age = calculateAge();
    if (age === null || !editedAsset.expected_lifespan_years) return null;
    return Math.max(0, editedAsset.expected_lifespan_years - age);
  };

  const calculateDepreciatedValue = () => {
    const age = calculateAge();
    if (age === null || !editedAsset.purchase_cost || !editedAsset.expected_lifespan_years) {
      return null;
    }
    const depreciationRate = Math.min(age / editedAsset.expected_lifespan_years, 1);
    return editedAsset.purchase_cost * (1 - depreciationRate) * editedAsset.quantity;
  };

  const tabs = [
    { id: "details" as TabType, label: "Details" },
    { id: "technical" as TabType, label: "Technical" },
    { id: "financial" as TabType, label: "Financial" },
    { id: "maintenance" as TabType, label: "Maintenance" },
    { id: "documents" as TabType, label: "Documents" },
  ];

  const InputField = ({
    label,
    field,
    type = "text",
  }: {
    label: string;
    field: keyof Asset;
    type?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={editedAsset[field] as string || ""}
          onChange={(e) => updateField(field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-gray-900 py-2">{(asset[field] as string) || "-"}</p>
      )}
    </div>
  );

  const SelectField = ({
    label,
    field,
    options,
  }: {
    label: string;
    field: keyof Asset;
    options: string[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {isEditing ? (
        <select
          value={editedAsset[field] as string || ""}
          onChange={(e) => updateField(field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-gray-900 py-2">{(asset[field] as string) || "-"}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {asset.asset_code}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {asset.location} • {asset.category}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedAsset(asset);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Asset Code" field="asset_code" />
              <InputField label="Location" field="location" />
              <SelectField
                label="Category"
                field="category"
                options={[
                  "Bedrooms",
                  "HVAC",
                  "Plantroom",
                  "Lifts",
                  "Fire safety",
                  "Kitchen",
                  "Bathrooms",
                  "IT / AV",
                ]}
              />
              <InputField label="Subcategory" field="subcategory" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedAsset.quantity}
                    onChange={(e) => updateField("quantity", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{asset.quantity}</p>
                )}
              </div>
              <SelectField
                label="Status"
                field="status"
                options={["Active", "Removed", "Planned", "Out of service"]}
              />
              <SelectField
                label="Condition"
                field="condition"
                options={["New", "Good", "Fair", "Poor", "Unknown"]}
              />
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedAsset.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{asset.description || "-"}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "technical" && (
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Manufacturer" field="manufacturer" />
              <InputField label="Model" field="model" />
              <InputField label="Serial Number" field="serial_number" />
              <InputField label="Supplier" field="supplier" />
              <InputField label="Capacity" field="capacity" />
              <InputField label="Voltage/Phase" field="voltage_phase" />
            </div>
          )}

          {activeTab === "financial" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Cost (per unit)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedAsset.purchase_cost || ""}
                      onChange={(e) =>
                        updateField("purchase_cost", parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {asset.purchase_cost
                        ? `€${asset.purchase_cost.toLocaleString()}`
                        : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installation Cost
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedAsset.installation_cost || ""}
                      onChange={(e) =>
                        updateField("installation_cost", parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {asset.installation_cost
                        ? `€${asset.installation_cost.toLocaleString()}`
                        : "-"}
                    </p>
                  )}
                </div>
                <InputField
                  label="Installation Date"
                  field="installation_date"
                  type="date"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Lifespan (years)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedAsset.expected_lifespan_years || ""}
                      onChange={(e) =>
                        updateField(
                          "expected_lifespan_years",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {asset.expected_lifespan_years || "-"}
                    </p>
                  )}
                </div>
                <SelectField
                  label="CapEx / OpEx"
                  field="capex_or_opex"
                  options={["CAPEX", "OPEX"]}
                />
              </div>

              {/* Lifecycle Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Lifecycle Information
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Current Age</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {calculateAge() !== null ? `${calculateAge()} years` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Remaining Life</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {calculateRemainingLife() !== null
                        ? `${calculateRemainingLife()} years`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Current Value</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {calculateDepreciatedValue() !== null
                        ? `€${Math.round(
                            calculateDepreciatedValue()!
                          ).toLocaleString()}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Warranty Start" field="warranty_start" type="date" />
              <InputField label="Warranty End" field="warranty_end" type="date" />
              <div className="col-span-2">
                <InputField label="Warranty Notes" field="warranty_notes" />
              </div>
              <InputField label="Maintenance Contractor" field="maintenance_contractor" />
              <InputField label="Maintenance Frequency" field="maintenance_frequency" />
              <InputField
                label="Last Service Date"
                field="last_service_date"
                type="date"
              />
              <InputField
                label="Next Service Date"
                field="next_service_date"
                type="date"
              />
              <InputField
                label="Service Contract Reference"
                field="service_contract_reference"
              />
              <InputField label="Last Inspection" field="last_inspection" type="date" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statutory Requirement
                </label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={editedAsset.statutory_requirement}
                    onChange={(e) =>
                      updateField("statutory_requirement", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                ) : (
                  <p className="text-gray-900 py-2">
                    {asset.statutory_requirement ? "Yes" : "No"}
                  </p>
                )}
              </div>
              <InputField label="Statutory Standard" field="statutory_standard" />
            </div>
          )}

          {activeTab === "documents" && (
            <DocumentSection assetId={asset.id} isEditing={isEditing} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(editedAsset.created_at).toLocaleString()}
              {editedAsset.created_by && ` by ${editedAsset.created_by}`}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{" "}
              {new Date(editedAsset.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Asset?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{asset.asset_code}"? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
