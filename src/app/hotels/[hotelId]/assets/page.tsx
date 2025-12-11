"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Eye,
  Plus,
  X,
} from "lucide-react";

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
  status: string | null;
  condition: string | null;
  supplier: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

interface AssetModalProps {
  asset: Asset;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// A simple list you can tweak later
const ASSET_CATEGORIES = [
  "Bedrooms",
  "HVAC",
  "Plantroom",
  "Lifts",
  "Fire safety",
  "Kitchen",
  "IT / AV",
];

const ASSET_STATUSES = ["Active", "Removed", "Planned", "Out of service"];

function AssetModal({ asset, onClose }: AssetModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-4/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl text-gray-900">
              {asset.asset_code || "Asset"}
            </h2>
            <p className="text-sm text-gray-500">
              Hotel {asset.hotel_id} · ID {asset.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-700 mb-2">Basic details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Code:</span>{" "}
                    <span className="text-gray-900">{asset.asset_code}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>{" "}
                    <span className="text-gray-900">
                      {asset.location || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>{" "}
                    <span className="text-gray-900">
                      {asset.category}
                      {asset.subcategory ? ` / ${asset.subcategory}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>{" "}
                    <span className="text-gray-900">{asset.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>{" "}
                    <span className="text-gray-900">
                      {asset.status || "Active"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>{" "}
                    <span className="text-gray-900">
                      {asset.condition || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-700 mb-2">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-line">
                  {asset.description || "No description recorded."}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-700 mb-2">Technical</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Manufacturer:</span>{" "}
                    <span className="text-gray-900">
                      {asset.manufacturer || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>{" "}
                    <span className="text-gray-900">{asset.model || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Supplier:</span>{" "}
                    <span className="text-gray-900">
                      {asset.supplier || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created by:</span>{" "}
                    <span className="text-gray-900">
                      {asset.created_by || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created at:</span>{" "}
                    <span className="text-gray-900">
                      {new Date(asset.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated at:</span>{" "}
                    <span className="text-gray-900">
                      {new Date(asset.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
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

  async function loadAssets() {
    if (!hotelId || !API_BASE) {
      setError("Missing hotel id or API base URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/assets?hotel_id=${encodeURIComponent(hotelId)}`,
        { cache: "no-store" },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const getStatusColor = (status: string | null) => {
    if (!status) return "text-gray-600 bg-gray-50";
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-50";
      case "removed":
      case "out of service":
        return "text-red-600 bg-red-50";
      case "planned":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
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
      <ChevronUp className="w-4 h-4 text-gray-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600" />
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
        asset.supplier,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(search));

    const matchesCategory =
      !selectedCategory || asset.category === selectedCategory;

    const matchesStatus =
      !selectedStatus ||
      (asset.status && asset.status.toLowerCase() === selectedStatus.toLowerCase());

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

  const total = assets.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg text-gray-900">Asset register</h2>
            <p className="mt-1 text-sm text-gray-500">
              Hotel: {hotelId} · {total} assets
            </p>
          </div>
          <a
            href={`/hotels/${hotelId}/assets/wizard`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New asset</span>
          </a>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets (code, location, manufacturer)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {(selectedCategory || selectedStatus) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {[selectedCategory, selectedStatus].filter(Boolean).length}
                  </span>
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                      <label className="block text-sm text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All statuses</option>
                        {ASSET_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCategory("");
                          setSelectedStatus("");
                        }}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {sorted.length} of {assets.length} assets
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="px-6 py-4 text-sm">Loading assets…</p>
        ) : error ? (
          <p className="px-6 py-4 text-sm text-red-600">{error}</p>
        ) : sorted.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-600">
            No assets found. Use the New asset button to add one.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort("asset_code")}
                    className="flex items-center space-x-1 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Code</span>
                    <SortIcon field="asset_code" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort("location")}
                    className="flex items-center space-x-1 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Location</span>
                    <SortIcon field="location" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Category
                  </span>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort("manufacturer")}
                    className="flex items-center space-x-1 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Manufacturer</span>
                    <SortIcon field="manufacturer" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Model
                  </span>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Status
                  </span>
                </th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sorted.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-blue-600">
                      {asset.asset_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900">
                        {asset.location || "-"}
                      </div>
                      {asset.description && (
                        <div className="text-xs text-gray-500">
                          {asset.description.slice(0, 40)}
                          {asset.description.length > 40 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        asset.category === "HVAC"
                          ? "bg-blue-100 text-blue-800"
                          : asset.category === "Fire safety"
                          ? "bg-red-100 text-red-800"
                          : asset.category === "Bedrooms"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {asset.category || "Uncategorised"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.manufacturer || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.model || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(
                        asset.status,
                      )}`}
                    >
                      {asset.status || "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {asset.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAsset(asset);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAsset && (
        <AssetModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}
