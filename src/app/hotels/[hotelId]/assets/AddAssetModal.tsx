"use client";

import { X, Plus } from "lucide-react";
import { useState } from "react";
import { useUserRedirect } from "@/lib/auth";

interface Asset {
  id: number;
  asset_code: string;
  hotel_id: string;
  [key: string]: any;
}

interface AddAssetModalProps {
  hotelId: string;
  existingAssets: Asset[];
  onClose: () => void;
  onAdd: (asset: any) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AddAssetModal({ hotelId, existingAssets, onClose, onAdd }: AddAssetModalProps) {
  const { getCurrentUser } = useUserRedirect();
  const currentUser = getCurrentUser();

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: hotelId.toLowerCase(), // Backend expects lowercase
    asset_code: "",
    location: "",
    category: "",
    subcategory: "",
    description: "",
    quantity: 1,
    manufacturer: "",
    model: "",
    serial_number: "",
    status: "Active",
    condition: "Unknown",
    purchase_cost: "",
    expected_lifespan_years: "",
    installation_date: "",
    warranty_start: "",
    warranty_end: "",
    warranty_notes: "",
    maintenance_contractor: "",
    maintenance_frequency: "",
    supplier: "",
    capacity: "",
    voltage_phase: "",
    capex_or_opex: "CAPEX",
  });

  // Auto-prefix and auto-increment asset code
  const handleAssetCodeChange = (value: string) => {
    const hotelPrefix = hotelId.toUpperCase();
    
    let cleanCode = value.trim().toUpperCase();
    
    // Remove hotel prefix if user already typed it
    if (cleanCode.startsWith(hotelPrefix + "-")) {
      cleanCode = cleanCode.substring(hotelPrefix.length + 1);
    }
    
    // Build the full code with prefix
    const fullCode = `${hotelPrefix}-${cleanCode}`;
    
    let finalCode = fullCode;
    
    // Extract base and number (e.g., "CAR-001" -> base="CAR", num=1)
    const match = cleanCode.match(/^(.+?)-(\d+)$/);
    if (match) {
      const base = match[1];
      let num = parseInt(match[2]);
      
      // Find highest existing number for this base
      const existingCodes = existingAssets
        .map(a => a.asset_code)
        .filter(code => code.startsWith(`${hotelPrefix}-${base}-`));
      
      existingCodes.forEach(code => {
        const numMatch = code.match(/-(\d+)$/);
        if (numMatch) {
          const existingNum = parseInt(numMatch[1]);
          if (existingNum >= num) {
            num = existingNum + 1;
          }
        }
      });
      
      // Pad with zeros to match original length
      const originalLength = match[2].length;
      const paddedNum = num.toString().padStart(originalLength, '0');
      finalCode = `${hotelPrefix}-${base}-${paddedNum}`;
    }
    
    setFormData(prev => ({ ...prev, asset_code: finalCode }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asset_code) {
      alert("Asset Code is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        expected_lifespan_years: formData.expected_lifespan_years ? parseInt(formData.expected_lifespan_years) : null,
        installation_date: formData.installation_date || null,
        warranty_start: formData.warranty_start || null,
        warranty_end: formData.warranty_end || null,
        // ✅ FIX: Record the actual logged-in user
        created_by: currentUser?.email ?? '',
      };

      const res = await fetch(`${API_BASE}/assets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to create asset");
      }

      const newAsset = await res.json();
      onAdd(newAsset);
      onClose();
    } catch (error: any) {
      console.error("Error creating asset:", error);
      alert(error.message || "Failed to create asset");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Add New Asset</h2>
              <p className="text-blue-100 text-sm mt-1">Create a single asset entry</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-lg text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Code <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.asset_code} 
                    onChange={(e) => handleAssetCodeChange(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder={`e.g., TV-001 (becomes ${hotelId.toUpperCase()}-TV-001)`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-prefixed with {hotelId.toUpperCase()}-</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => updateField("location", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Room 621, Kitchen" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => updateField("category", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select category...</option>
                    <option value="FF&E">FF&E</option>
                    <option value="Bedrooms">Bedrooms</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Plantroom">Plantroom</option>
                    <option value="Lifts">Lifts</option>
                    <option value="Fire safety">Fire safety</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bathrooms">Bathrooms</option>
                    <option value="IT / AV">IT / AV</option>
                    <option value="Living">Living</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="1" value={formData.quantity} onChange={(e) => updateField("quantity", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input type="text" value={formData.manufacturer} onChange={(e) => updateField("manufacturer", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input type="text" value={formData.model} onChange={(e) => updateField("model", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost (€)</label>
                  <input type="number" step="0.01" value={formData.purchase_cost} onChange={(e) => updateField("purchase_cost", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                  <input type="date" value={formData.installation_date} onChange={(e) => updateField("installation_date", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Lifespan (years)</label>
                  <input type="number" value={formData.expected_lifespan_years} onChange={(e) => updateField("expected_lifespan_years", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600"><span className="text-red-600">*</span> Required fields</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={isSaving || !formData.asset_code} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              {isSaving ? "Creating..." : "Create Asset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
