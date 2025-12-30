"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  Edit, 
  Save, 
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Asset {
  id: number;
  asset_code: string;
  category: string;
  subcategory: string;
  location: string;
  purchase_cost: number | null;
  manufacturer: string | null;
  model: string | null;
  om_manual_path: string | null;
  manual_template_id: number | null;
}

interface BulkUpdate {
  purchase_cost?: number;
  manufacturer?: string;
  model?: string;
  expected_lifespan_years?: number;
  supplier?: string;
  warranty_years?: number;
}

export default function BulkAssetManagementPage() {
  const params = useParams<{ hotelId: string }>();
  const hotelId = params?.hotelId;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const [bulkUpdate, setBulkUpdate] = useState<BulkUpdate>({});
  const [excludedAssets, setExcludedAssets] = useState<Set<number>>(new Set());
  
  const [savingChanges, setSavingChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load assets
  useEffect(() => {
    if (hotelId) {
      loadAssets();
    }
  }, [hotelId]);

  const loadAssets = async () => {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const url = `${API_BASE}/api/assets/?hotel_id=${hotelId}&t=${Date.now()}`;
      console.log('Loading assets from:', url);
      
      const res = await fetch(url, {
        cache: 'no-store' // Prevent caching
      });
      
      if (!res.ok) throw new Error("Failed to load assets");
      const data = await res.json();
      
      console.log(`Loaded ${data.length} assets`);
      
      setAssets(data);
      setFilteredAssets(data);
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  // Get unique categories and subcategories
  const categories = [...new Set(assets.map(a => a.category))].filter(Boolean).sort();
  const subcategories = selectedCategory
    ? [...new Set(assets.filter(a => a.category === selectedCategory).map(a => a.subcategory))].filter(Boolean).sort()
    : [];

  // Filter assets
  useEffect(() => {
    let filtered = assets;

    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(a => a.subcategory === selectedSubcategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.asset_code.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        a.subcategory?.toLowerCase().includes(term)
      );
    }

    setFilteredAssets(filtered);
  }, [selectedCategory, selectedSubcategory, searchTerm, assets]);

  const assetsToUpdate = filteredAssets.filter(a => !excludedAssets.has(a.id));

  const handleBulkSave = async () => {
    if (Object.keys(bulkUpdate).length === 0) {
      setMessage({ type: 'error', text: 'No changes to save' });
      return;
    }

    // Debug: Log what we're sending
    console.log('Bulk Update Data:', bulkUpdate);
    console.log('API Base:', API_BASE);
    console.log('Assets to update:', assetsToUpdate.length);

    setSavingChanges(true);
    setMessage(null);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      // Update each asset
      for (const asset of assetsToUpdate) {
        try {
          const url = `${API_BASE}/api/assets/${asset.id}`;
          console.log(`Updating ${asset.asset_code} at ${url}`);
          
          const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bulkUpdate)
          });

          if (!res.ok) {
            const errorText = await res.text();
            failCount++;
            errors.push(`${asset.asset_code}: ${errorText}`);
            console.error(`Failed to update ${asset.asset_code}:`, res.status, errorText);
          } else {
            successCount++;
            console.log(`✓ Successfully updated ${asset.asset_code}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${asset.asset_code}: ${error}`);
          console.error(`Error updating ${asset.asset_code}:`, error);
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully updated ${successCount} assets` 
        });
      } else if (successCount > 0 && failCount > 0) {
        setMessage({ 
          type: 'error', 
          text: `Updated ${successCount} assets, but ${failCount} failed. Check console for details.` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to update all ${failCount} assets. Check console for details.` 
        });
      }
      
      // Reload assets to show changes
      await loadAssets();
      
      // Reset form only if fully successful
      if (failCount === 0) {
        setBulkUpdate({});
        setExcludedAssets(new Set());
      }
      
    } catch (error) {
      console.error('Bulk update error:', error);
      setMessage({ type: 'error', text: 'Failed to update assets' });
    } finally {
      setSavingChanges(false);
    }
  };

  const toggleExclude = (assetId: number) => {
    const newExcluded = new Set(excludedAssets);
    if (newExcluded.has(assetId)) {
      newExcluded.delete(assetId);
    } else {
      newExcluded.add(assetId);
    }
    setExcludedAssets(newExcluded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Bulk Asset Management</h1>
          <p className="text-gray-600 mt-1">
            Update multiple assets at once - perfect for updating prices or fixing specs across all items
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Asset code, location..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              {selectedCategory && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Items</option>
                    {subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filtered Assets:</span>
                    <span className="font-semibold text-gray-900">{filteredAssets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Will Update:</span>
                    <span className="font-semibold text-blue-600">{assetsToUpdate.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Excluded:</span>
                    <span className="font-semibold text-gray-900">{excludedAssets.size}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Update Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Edit className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Bulk Update</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Cost (€)
                  </label>
                  <input
                    type="number"
                    value={bulkUpdate.purchase_cost || ''}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, purchase_cost: parseFloat(e.target.value) || undefined })}
                    placeholder="Leave empty to skip"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={bulkUpdate.manufacturer || ''}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, manufacturer: e.target.value || undefined })}
                    placeholder="e.g., Samsung, LG"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={bulkUpdate.model || ''}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, model: e.target.value || undefined })}
                    placeholder="e.g., UN50TU7000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Lifespan (years)
                  </label>
                  <input
                    type="number"
                    value={bulkUpdate.expected_lifespan_years || ''}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, expected_lifespan_years: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 7"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={bulkUpdate.supplier || ''}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, supplier: e.target.value || undefined })}
                    placeholder="e.g., Direct Supply Co."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty (years)
                  </label>
                  <input
                    type="number"
                    value={bulkUpdate.warranty_years || ''}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, warranty_years: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleBulkSave}
                disabled={savingChanges || assetsToUpdate.length === 0 || Object.keys(bulkUpdate).length === 0}
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {savingChanges ? 'Saving...' : `Update ${assetsToUpdate.length} Assets`}
              </button>
            </div>
          </div>

          {/* Right: Asset List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Filtered Assets ({filteredAssets.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Uncheck assets you don't want to update
                </p>
              </div>

              {/* Messages */}
              {message && (
                <div className={`mx-6 mt-4 p-4 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-sm ${
                      message.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {message.text}
                    </p>
                    <button
                      onClick={() => setMessage(null)}
                      className="ml-auto"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Asset List */}
              <div className="divide-y divide-gray-200 max-h-[800px] overflow-y-auto">
                {filteredAssets.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No assets match your filters</p>
                  </div>
                ) : (
                  filteredAssets.map(asset => (
                    <div key={asset.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={!excludedAssets.has(asset.id)}
                          onChange={() => toggleExclude(asset.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 truncate">
                              {asset.asset_code}
                            </p>
                            {asset.purchase_cost && (
                              <p className="text-sm font-medium text-gray-900 ml-4">
                                €{asset.purchase_cost}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {asset.location}
                            </p>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {asset.subcategory}
                            </span>
                          </div>
                          {(asset.manufacturer || asset.model) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {asset.manufacturer} {asset.model}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
