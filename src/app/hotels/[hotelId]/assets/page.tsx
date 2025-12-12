"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Plus,
  Download,
  Euro,
  Package,
  TrendingDown,
  X,
} from "lucide-react";
import DepreciationTracker from "./DepreciationTracker";

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

// Extract floor number from location
function extractFloor(location: string | null): number | null {
  if (!location) return null;
  
  // Match patterns like "Room 621", "Floor 6", "6th Floor", "Rm 301"
  const patterns = [
    /room\s*(\d)(\d{2})/i,  // "Room 621" -> floor 6
    /rm\s*(\d)(\d{2})/i,     // "Rm 621" -> floor 6
    /floor\s*(\d+)/i,        // "Floor 6" -> floor 6
    /(\d+)(?:st|nd|rd|th)\s*floor/i, // "6th Floor" -> floor 6
  ];

  for (const pattern of patterns) {
    const match = location.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
}

// Get unique locations for filtering
function getUniqueLocations(assets: Asset[]): string[] {
  const locations = new Set<string>();
  assets.forEach(asset => {
    if (asset.location) {
      locations.add(asset.location);
    }
  });
  return Array.from(locations).sort();
}

// Get unique floors
function getUniqueFloors(assets: Asset[]): number[] {
  const floors = new Set<number>();
  assets.forEach(asset => {
    const floor = extractFloor(asset.location);
    if (floor !== null) {
      floors.add(floor);
    }
  });
  return Array.from(floors).sort((a, b) => a - b);
}

export default function AssetsPage() {
  const params = useParams<{ hotelId: string }>();
  const hotelId = params?.hotelId as string;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFloors, setSelectedFloors] = useState<number[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [sortField, setSortField] = useState<keyof Asset | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDepreciationTracker, setShowDepreciationTracker] = useState(false);

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

    const matchesFloor =
      selectedFloors.length === 0 ||
      (extractFloor(asset.location) !== null &&
        selectedFloors.includes(extractFloor(asset.location)!));

    const matchesLocation =
      selectedLocations.length === 0 ||
      (asset.location && selectedLocations.includes(asset.location));

    return matchesSearch && matchesCategory && matchesFloor && matchesLocation;
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

  const uniqueFloors = getUniqueFloors(assets);
  const uniqueLocations = getUniqueLocations(assets);

  const toggleFloor = (floor: number) => {
    setSelectedFloors(prev =>
      prev.includes(floor)
        ? prev.filter(f => f !== floor)
        : [...prev, floor]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedFloors([]);
    setSelectedLocations([]);
  };

  const activeFilters = [
    selectedCategory && "Category",
    selectedFloors.length > 0 && `${selectedFloors.length} Floor(s)`,
    selectedLocations.length > 0 && `${selectedLocations.length} Location(s)`,
  ].filter(Boolean);

  const exportToCSV = () => {
    if (sorted.length === 0) return;

    // Get all keys from the first asset
    const headers = Object.keys(sorted[0]);

    const rows = sorted.map((asset) =>
      headers.map(key => {
        const value = asset[key as keyof Asset];
        if (value === null || value === undefined) return "";
        // Escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
    );

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets-${hotelId}-${new Date().toISOString().split("T")[0]}.csv`;
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
              <a
                href={`/hotels/${hotelId}/assets/wizard`}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Setup Wizard
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <Euro className="w-5 h-5 text-green-600" />
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
              <p className="text-sm text-gray-600 font-medium">Depreciation</p>
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <button
              onClick={() => setShowDepreciationTracker(true)}
              className="w-full mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              View Tracker
            </button>
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
                        {activeFilters.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {activeFilters.length}
                          </span>
                        )}
                      </button>

                      {showFilterDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto">
                          <div className="p-4 space-y-4">
                            {/* Category Filter */}
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

                            {/* Floor Filter */}
                            {uniqueFloors.length > 0 && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Floors
                                </label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {uniqueFloors.map(floor => (
                                    <label key={floor} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedFloors.includes(floor)}
                                        onChange={() => toggleFloor(floor)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">
                                        Floor {floor}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Location Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Specific Locations
                              </label>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {uniqueLocations.slice(0, 20).map(location => (
                                  <label key={location} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedLocations.includes(location)}
                                      onChange={() => toggleLocation(location)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 truncate">
                                      {location}
                                    </span>
                                  </label>
                                ))}
                                {uniqueLocations.length > 20 && (
                                  <p className="text-xs text-gray-500 italic">
                                    + {uniqueLocations.length - 20} more locations
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                              <button
                                onClick={clearFilters}
                                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                Clear All
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
                  {activeFilters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span>Active: {activeFilters.join(", ")}</span>
                      <button
                        onClick={clearFilters}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    </div>
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
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No assets found</p>
                    <a
                      href={`/hotels/${hotelId}/assets/wizard`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Setup Wizard
                    </a>
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
                        <th className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleSort("purchase_cost")}
                            className="flex items-center justify-end space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 ml-auto"
                          >
                            <span>Value</span>
                            <SortIcon field="purchase_cost" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort("updated_at")}
                            className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            <span>Last Updated</span>
                            <SortIcon field="updated_at" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {sorted.map((asset) => (
                        <tr
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
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
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                            {asset.purchase_cost
                              ? `€${(
                                  asset.purchase_cost * asset.quantity
                                ).toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(asset.updated_at).toLocaleDateString()}
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

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowDepreciationTracker(true)}
                  className="w-full px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Depreciation Tracker
                </button>
                <button className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Generate Report
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

      {/* Depreciation Tracker Modal */}
      {showDepreciationTracker && (
        <DepreciationTracker
          assets={assets}
          onClose={() => setShowDepreciationTracker(false)}
        />
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAsset.asset_code}
                </h2>
                <p className="text-sm text-gray-500">{selectedAsset.location}</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-gray-900">{selectedAsset.category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Value</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedAsset.purchase_cost
                      ? `€${(selectedAsset.purchase_cost * selectedAsset.quantity).toLocaleString()}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Manufacturer</p>
                  <p className="text-gray-900">{selectedAsset.manufacturer || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Model</p>
                  <p className="text-gray-900">{selectedAsset.model || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="text-gray-900">
                    {new Date(selectedAsset.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="text-gray-900">
                    {new Date(selectedAsset.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedAsset.description && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900">{selectedAsset.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
