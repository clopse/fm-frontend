"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  Download,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Package,
  Plus,
  Eye,
  Edit,
} from "lucide-react";
import AssetDetailModal from "./AssetDetailModal";
import AddAssetModal from "./AddAssetModal";

type Asset = {
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
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const ASSET_CATEGORIES = [
  "Bedrooms",
  "HVAC",
  "Plantroom",
  "Lifts",
  "Fire safety",
  "Kitchen",
  "Bathrooms",
  "IT / AV",
  "Living",
  "Electrical",
  "Plumbing",
  "Security",
];

const ASSET_STATUSES = ["Active", "Removed", "Planned", "Out of service"];

export default function EnhancedAssetRegister() {
  const params = useParams<{ hotelId: string }>();
  const hotelId = params?.hotelId as string;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [sortField, setSortField] = useState<keyof Asset | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  async function loadAssets() {
    if (!hotelId || !API_BASE) {
      setError("Missing hotel ID or API base URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/assets/?hotel_id=${encodeURIComponent(hotelId)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to load assets", res.status, text);
        setError("Failed to load assets");
        setAssets([]);
        return;
      }

      const data: Asset[] = await res.json();
      setAssets(data || []);
    } catch (e) {
      console.error("Error loading assets", e);
      setError("Error loading assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, [hotelId]);

  const handleAssetUpdate = (updatedAsset: Asset) => {
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const handleAssetDelete = (assetId: number) => {
    setAssets(assets.filter(a => a.id !== assetId));
  };

  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon: React.FC<{ field: keyof Asset }> = ({ field }) => {
    if (sortField !== field)
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  const filtered = assets.filter((asset) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      [
        asset.asset_code,
        asset.location,
        asset.category,
        asset.subcategory,
        asset.description,
        asset.manufacturer,
        asset.model,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(search));

    const matchesCategory =
      !selectedCategory || asset.category === selectedCategory;

    const matchesStatus =
      !selectedStatus ||
      (asset.status &&
        asset.status.toLowerCase() === selectedStatus.toLowerCase());

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (sortDirection === "asc") {
      return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
    }
    return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
  });

  // Calculate statistics
  const totalAssets = assets.length;
  const totalValue = assets.reduce(
    (sum, a) => sum + (a.purchase_cost || 0) * a.quantity,
    0
  );

  const categoryBreakdown = assets.reduce((acc, asset) => {
    const cat = asset.category || "Uncategorized";
    if (!acc[cat]) {
      acc[cat] = { count: 0, value: 0 };
    }
    acc[cat].count += asset.quantity;
    acc[cat].value += (asset.purchase_cost || 0) * asset.quantity;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const statusBreakdown = assets.reduce((acc, asset) => {
    const status = asset.status || "Active";
    acc[status] = (acc[status] || 0) + asset.quantity;
    return acc;
  }, {} as Record<string, number>);

  const averageAge =
    assets.length > 0
      ? assets
          .filter((a) => a.installation_date)
          .reduce((sum, a) => {
            const years =
              new Date().getFullYear() -
              new Date(a.installation_date!).getFullYear();
            return sum + years;
          }, 0) / assets.filter((a) => a.installation_date).length
      : 0;

  const avgLifespan =
    assets.length > 0
      ? assets
          .filter((a) => a.expected_lifespan_years)
          .reduce((sum, a) => sum + (a.expected_lifespan_years || 0), 0) /
        assets.filter((a) => a.expected_lifespan_years).length
      : 0;

  const exportToCSV = () => {
    const headers = [
      "Asset Code",
      "Location",
      "Category",
      "Subcategory",
      "Description",
      "Quantity",
      "Manufacturer",
      "Model",
      "Serial Number",
      "Status",
      "Purchase Cost",
      "Installation Date",
      "Lifespan (Years)",
    ];

    const rows = sorted.map((a) => [
      a.asset_code,
      a.location || "",
      a.category || "",
      a.subcategory || "",
      a.description || "",
      a.quantity,
      a.manufacturer || "",
      a.model || "",
      a.serial_number || "",
      a.status || "",
      a.purchase_cost || "",
      a.installation_date || "",
      a.expected_lifespan_years || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-register-${hotelId}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Asset Register</h1>
              <p className="text-blue-100 mt-2">
                Property: {hotelId} • Complete asset inventory & valuation
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Asset
              </button>
              <a
                href={`/hotels/${hotelId}/assets/wizard`}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Setup Wizard
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Assets</p>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {totalAssets.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Object.keys(categoryBreakdown).length} categories
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Value</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              €{totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Avg €
              {totalAssets > 0
                ? Math.round(totalValue / totalAssets).toLocaleString()
                : 0}{" "}
              per asset
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Avg Asset Age</p>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {averageAge.toFixed(1)}{" "}
              <span className="text-lg text-gray-500">yr</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Expected life: {avgLifespan.toFixed(1)}yr
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Insurance Est.</p>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              €{Math.round(totalValue * 0.0035).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Annual @ 0.35% rate</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Assets Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Controls */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                        {(selectedCategory || selectedStatus) && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {
                              [selectedCategory, selectedStatus].filter(Boolean)
                                .length
                            }
                          </span>
                        )}
                      </button>

                      {showFilterDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                          <div className="p-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                              </label>
                              <select
                                value={selectedCategory}
                                onChange={(e) =>
                                  setSelectedCategory(e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">All categories</option>
                                {ASSET_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                              </label>
                              <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">All statuses</option>
                                {ASSET_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setSelectedCategory("");
                                  setSelectedStatus("");
                                }}
                                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => setShowFilterDropdown(false)}
                                className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={exportToCSV}
                    className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Showing {sorted.length} of {assets.length} assets
                  </span>
                  {(selectedCategory || selectedStatus) && (
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setSelectedStatus("");
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    Loading assets...
                  </div>
                ) : error ? (
                  <div className="px-6 py-12 text-center text-red-600">
                    {error}
                  </div>
                ) : sorted.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No assets found</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Asset
                      </button>
                      <a
                        href={`/hotels/${hotelId}/assets/wizard`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Setup Wizard
                      </a>
                    </div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort("asset_code")}
                            className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            <span>Asset Code</span>
                            <SortIcon field="asset_code" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort("location")}
                            className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            <span>Location</span>
                            <SortIcon field="location" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {sorted.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">
                              {asset.asset_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {asset.location || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                              {asset.category || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {asset.description || asset.subcategory || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                            {asset.purchase_cost
                              ? `€${(
                                  asset.purchase_cost * asset.quantity
                                ).toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                asset.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : asset.status === "Out of service"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {asset.status || "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedAsset(asset)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View / Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Category Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Category Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryBreakdown)
                  .sort((a, b) => b[1].value - a[1].value)
                  .map(([category, data]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{category}</p>
                        <p className="text-xs text-gray-500">{data.count} units</p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        €{data.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Status Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-700">{status}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate Report
                </button>
                <button className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Insurance Valuation
                </button>
                <button className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Depreciation Schedule
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Export to Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdate={handleAssetUpdate}
          onDelete={handleAssetDelete}
        />
      )}

      {showAddModal && (
        <AddAssetModal
          hotelId={hotelId}
          onClose={() => setShowAddModal(false)}
          onAssetAdded={() => {
            setShowAddModal(false);
            loadAssets();
          }}
        />
      )}
    </div>
  );
}
