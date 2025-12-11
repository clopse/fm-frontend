"use client";

import { useState } from "react";
import { X, Edit2, Save, Upload, FileText, Image, Calendar, AlertCircle, CheckCircle } from "lucide-react";

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
  capacity: string | null;
  voltage_phase: string | null;
  supplier: string | null;
  installation_date: string | null;
  purchase_cost: number | null;
  installation_cost: number | null;
  capex_or_opex: string | null;
  expected_lifespan_years: number | null;
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
  condition: string | null;
  status: string | null;
  fault_notes: string | null;
  last_inspection: string | null;
  om_manual_path: string | null;
  commissioning_cert_path: string | null;
  warranty_doc_path: string | null;
  photos_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (updatedAsset: Asset) => void;
  onDelete?: (assetId: number) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = ["Bedrooms", "HVAC", "Plantroom", "Lifts", "Fire safety", "Kitchen", "Bathrooms", "IT / AV", "Living", "Electrical", "Plumbing", "Security"];
const STATUSES = ["Active", "Out of service", "Removed", "Planned"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Unknown"];

export default function AssetDetailModal({ asset, onClose, onUpdate, onDelete }: AssetDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "technical" | "financial" | "maintenance" | "documents">("details");
  const [editedAsset, setEditedAsset] = useState<Asset>(asset);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!API_BASE) {
      setErrorMessage("API URL not configured");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE}/assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedAsset),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to update: ${text}`);
      }

      const updated = await response.json();
      onUpdate(updated);
      setIsEditing(false);
      setSaveMessage("Asset updated successfully");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete asset ${asset.asset_code}?`)) return;
    if (!API_BASE || !onDelete) return;

    try {
      const response = await fetch(`${API_BASE}/assets/${asset.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      onDelete(asset.id);
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to delete asset");
    }
  };

  const updateField = (field: keyof Asset, value: any) => {
    setEditedAsset({ ...editedAsset, [field]: value });
  };

  const handleFileUpload = async (field: "om_manual_path" | "commissioning_cert_path" | "warranty_doc_path" | "photos_path") => {
    // Placeholder for file upload functionality
    alert("File upload will be implemented with your storage solution (S3, etc.)");
    // You'll implement this based on your storage solution
  };

  const calculateAge = () => {
    if (!asset.installation_date) return null;
    const installed = new Date(asset.installation_date);
    const now = new Date();
    const years = now.getFullYear() - installed.getFullYear();
    return years;
  };

  const calculateRemainingLife = () => {
    const age = calculateAge();
    if (age === null || !asset.expected_lifespan_years) return null;
    return Math.max(0, asset.expected_lifespan_years - age);
  };

  const calculateDepreciation = () => {
    const age = calculateAge();
    if (age === null || !asset.expected_lifespan_years || !asset.purchase_cost) return null;
    const depreciationRate = age / asset.expected_lifespan_years;
    const currentValue = asset.purchase_cost * (1 - Math.min(depreciationRate, 1));
    return currentValue;
  };

  const age = calculateAge();
  const remainingLife = calculateRemainingLife();
  const currentValue = calculateDepreciation();

  const tabs = [
    { id: "details" as const, label: "Details" },
    { id: "technical" as const, label: "Technical" },
    { id: "financial" as const, label: "Financial" },
    { id: "maintenance" as const, label: "Maintenance" },
    { id: "documents" as const, label: "Documents" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{asset.asset_code}</h2>
              <p className="text-sm text-gray-500">{asset.location || "No location"}</p>
            </div>
            <div className="flex items-center space-x-2">
              {saveMessage && (
                <span className="flex items-center text-sm text-green-600 mr-4">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {saveMessage}
                </span>
              )}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedAsset(asset);
                      setErrorMessage(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errorMessage}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Code *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAsset.asset_code}
                      onChange={(e) => updateField("asset_code", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-mono">{asset.asset_code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAsset.location || ""}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{asset.location || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAsset.category || ""}
                      onChange={(e) => updateField("category", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{asset.category || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAsset.subcategory || ""}
                      onChange={(e) => updateField("subcategory", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{asset.subcategory || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAsset.status || "Active"}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{asset.status || "Active"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAsset.condition || "Unknown"}
                      onChange={(e) => updateField("condition", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{asset.condition || "Unknown"}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedAsset.description || ""}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{asset.description || "-"}</p>
                  )}
                </div>
              </div>

              {/* Lifecycle Information */}
              {(age !== null || remainingLife !== null || currentValue !== null) && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Lifecycle Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {age !== null && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-700 mb-1">Current Age</p>
                        <p className="text-2xl font-bold text-blue-900">{age} years</p>
                      </div>
                    )}
                    {remainingLife !== null && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-1">Remaining Life</p>
                        <p className="text-2xl font-bold text-green-900">{remainingLife} years</p>
                      </div>
                    )}
                    {currentValue !== null && asset.purchase_cost && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-700 mb-1">Current Value</p>
                        <p className="text-2xl font-bold text-purple-900">€{Math.round(currentValue).toLocaleString()}</p>
                        <p className="text-xs text-purple-600 mt-1">
                          {Math.round((currentValue / asset.purchase_cost) * 100)}% of original
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === "technical" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.manufacturer || ""}
                    onChange={(e) => updateField("manufacturer", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.manufacturer || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.model || ""}
                    onChange={(e) => updateField("model", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.model || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.serial_number || ""}
                    onChange={(e) => updateField("serial_number", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-mono">{asset.serial_number || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.capacity || ""}
                    onChange={(e) => updateField("capacity", e.target.value)}
                    placeholder="e.g., 50kW, 500L"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.capacity || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voltage / Phase
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.voltage_phase || ""}
                    onChange={(e) => updateField("voltage_phase", e.target.value)}
                    placeholder="e.g., 230V 1ph, 400V 3ph"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.voltage_phase || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.supplier || ""}
                    onChange={(e) => updateField("supplier", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.supplier || "-"}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={editedAsset.statutory_requirement}
                    onChange={(e) => updateField("statutory_requirement", e.target.checked)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Statutory Requirement</span>
                </label>
                {editedAsset.statutory_requirement && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standard / Regulation
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedAsset.statutory_standard || ""}
                        onChange={(e) => updateField("statutory_standard", e.target.value)}
                        placeholder="e.g., IS 3217, EN 12101"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{asset.statutory_standard || "-"}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Cost (€)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedAsset.purchase_cost || ""}
                      onChange={(e) => updateField("purchase_cost", parseFloat(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {asset.purchase_cost ? `€${asset.purchase_cost.toLocaleString()}` : "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Cost (€)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedAsset.installation_cost || ""}
                      onChange={(e) => updateField("installation_cost", parseFloat(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {asset.installation_cost ? `€${asset.installation_cost.toLocaleString()}` : "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CapEx / OpEx
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAsset.capex_or_opex || ""}
                      onChange={(e) => updateField("capex_or_opex", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="CAPEX">CapEx</option>
                      <option value="OPEX">OpEx</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{asset.capex_or_opex || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Lifespan (years)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedAsset.expected_lifespan_years || ""}
                      onChange={(e) => updateField("expected_lifespan_years", parseInt(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {asset.expected_lifespan_years ? `${asset.expected_lifespan_years} years` : "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedAsset.installation_date || ""}
                      onChange={(e) => updateField("installation_date", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {asset.installation_date ? new Date(asset.installation_date).toLocaleDateString() : "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedAsset.quantity}
                      onChange={(e) => updateField("quantity", parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{asset.quantity}</p>
                  )}
                </div>
              </div>

              {/* Warranty */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Warranty Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Start
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedAsset.warranty_start || ""}
                        onChange={(e) => updateField("warranty_start", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {asset.warranty_start ? new Date(asset.warranty_start).toLocaleDateString() : "-"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty End
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedAsset.warranty_end || ""}
                        onChange={(e) => updateField("warranty_end", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {asset.warranty_end ? new Date(asset.warranty_end).toLocaleDateString() : "-"}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Notes
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedAsset.warranty_notes || ""}
                        onChange={(e) => updateField("warranty_notes", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">{asset.warranty_notes || "-"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Contractor
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.maintenance_contractor || ""}
                    onChange={(e) => updateField("maintenance_contractor", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.maintenance_contractor || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Frequency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.maintenance_frequency || ""}
                    onChange={(e) => updateField("maintenance_frequency", e.target.value)}
                    placeholder="e.g., Monthly, Quarterly, Annual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.maintenance_frequency || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Service Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedAsset.last_service_date || ""}
                    onChange={(e) => updateField("last_service_date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {asset.last_service_date ? new Date(asset.last_service_date).toLocaleDateString() : "-"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Service Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedAsset.next_service_date || ""}
                    onChange={(e) => updateField("next_service_date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {asset.next_service_date ? new Date(asset.next_service_date).toLocaleDateString() : "-"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Contract Reference
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAsset.service_contract_reference || ""}
                    onChange={(e) => updateField("service_contract_reference", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{asset.service_contract_reference || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Inspection
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedAsset.last_inspection || ""}
                    onChange={(e) => updateField("last_inspection", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {asset.last_inspection ? new Date(asset.last_inspection).toLocaleDateString() : "-"}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fault Notes
                </label>
                {isEditing ? (
                  <textarea
                    value={editedAsset.fault_notes || ""}
                    onChange={(e) => updateField("fault_notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{asset.fault_notes || "-"}</p>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">O&M Manual</span>
                    </div>
                    {asset.om_manual_path ? (
                      <a
                        href={asset.om_manual_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                  {asset.om_manual_path ? (
                    <p className="text-sm text-gray-600">Document uploaded</p>
                  ) : (
                    <p className="text-sm text-gray-500">No manual uploaded</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleFileUpload("om_manual_path")}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Manual
                    </button>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-gray-900">Commissioning Cert</span>
                    </div>
                    {asset.commissioning_cert_path ? (
                      <a
                        href={asset.commissioning_cert_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                  {asset.commissioning_cert_path ? (
                    <p className="text-sm text-gray-600">Certificate uploaded</p>
                  ) : (
                    <p className="text-sm text-gray-500">No certificate uploaded</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleFileUpload("commissioning_cert_path")}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Certificate
                    </button>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium text-gray-900">Warranty Document</span>
                    </div>
                    {asset.warranty_doc_path ? (
                      <a
                        href={asset.warranty_doc_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                  {asset.warranty_doc_path ? (
                    <p className="text-sm text-gray-600">Warranty uploaded</p>
                  ) : (
                    <p className="text-sm text-gray-500">No warranty uploaded</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleFileUpload("warranty_doc_path")}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Warranty
                    </button>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Image className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="font-medium text-gray-900">Photos</span>
                    </div>
                    {asset.photos_path ? (
                      <a
                        href={asset.photos_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                  {asset.photos_path ? (
                    <p className="text-sm text-gray-600">Photos uploaded</p>
                  ) : (
                    <p className="text-sm text-gray-500">No photos uploaded</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleFileUpload("photos_path")}
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Asset History</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">
                        <span className="font-medium">Created</span> on {new Date(asset.created_at).toLocaleString()}
                      </p>
                      {asset.created_by && (
                        <p className="text-gray-500">by {asset.created_by}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">
                        <span className="font-medium">Last updated</span> on {new Date(asset.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {onDelete && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Delete Asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
