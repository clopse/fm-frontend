"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface Asset {
  id: number;
  asset_code: string;
  category: string | null;
  purchase_cost: number | null;
  installation_date: string | null;
  expected_lifespan_years: number | null;
  quantity: number;
}

interface DepreciationTrackerProps {
  assets: Asset[];
  onClose: () => void;
}

interface YearData {
  year: number;
  depreciatedValue: number;
  newPurchases: number;
}

interface CategoryDepreciation {
  category: string;
  years: Map<number, YearData>;
  totalValue: number;
}

export default function DepreciationTracker({ assets, onClose }: DepreciationTrackerProps) {
  const currentYear = new Date().getFullYear();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Calculate depreciation
  const calculateDepreciation = () => {
    const categories = new Map<string, CategoryDepreciation>();
    
    // Get all years we need to track (from oldest installation to current year)
    const oldestYear = assets.reduce((min, asset) => {
      if (asset.installation_date) {
        const year = new Date(asset.installation_date).getFullYear();
        return Math.min(min, year);
      }
      return min;
    }, currentYear);

    const years = [];
    for (let year = currentYear; year >= oldestYear; year--) {
      years.push(year);
    }

    // Process each asset
    assets.forEach(asset => {
      if (!asset.purchase_cost || !asset.installation_date || !asset.expected_lifespan_years) {
        return;
      }

      const category = asset.category || "Uncategorized";
      const installYear = new Date(asset.installation_date).getFullYear();
      const totalCost = asset.purchase_cost * asset.quantity;
      const lifespan = asset.expected_lifespan_years;

      if (!categories.has(category)) {
        categories.set(category, {
          category,
          years: new Map(),
          totalValue: 0,
        });
      }

      const catData = categories.get(category)!;
      catData.totalValue += totalCost;

      // Calculate depreciation for each year
      years.forEach(year => {
        const yearsOwned = year - installYear;
        
        if (yearsOwned < 0) {
          // Asset not yet purchased
          return;
        }

        if (!catData.years.has(year)) {
          catData.years.set(year, {
            year,
            depreciatedValue: 0,
            newPurchases: 0,
          });
        }

        const yearData = catData.years.get(year)!;

        // Track new purchases in this year
        if (year === installYear) {
          yearData.newPurchases += totalCost;
        }

        // Calculate remaining value
        if (yearsOwned >= lifespan) {
          // Fully depreciated - no value
          yearData.depreciatedValue += 0;
        } else {
          // Calculate depreciation
          const depreciationRate = yearsOwned / lifespan;
          const remainingValue = totalCost * (1 - depreciationRate);
          yearData.depreciatedValue += remainingValue;
        }
      });
    });

    return { categories, years };
  };

  const { categories, years } = calculateDepreciation();

  // Filter by selected category
  const filteredCategories = selectedCategory === "All"
    ? Array.from(categories.values())
    : Array.from(categories.values()).filter(c => c.category === selectedCategory);

  // Calculate totals per year
  const yearTotals = new Map<number, { depreciated: number; purchases: number }>();
  years.forEach(year => {
    let depreciated = 0;
    let purchases = 0;
    
    categories.forEach(catData => {
      const yearData = catData.years.get(year);
      if (yearData) {
        depreciated += yearData.depreciatedValue;
        purchases += yearData.newPurchases;
      }
    });

    yearTotals.set(year, { depreciated, purchases });
  });

  const grandTotal = Array.from(categories.values()).reduce((sum, cat) => sum + cat.totalValue, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Depreciation Tracker</h2>
              <p className="text-blue-100 text-sm mt-1">
                Asset value depreciation by year and category
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-3">
                Filter by Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="All">All Categories</option>
                {Array.from(categories.keys()).sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total Asset Value:</span> €{grandTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Current Year Value</p>
              <p className="text-2xl font-bold text-gray-900">
                €{Math.round(yearTotals.get(currentYear)?.depreciated || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">New Purchases {currentYear}</p>
              <p className="text-2xl font-bold text-green-600">
                €{Math.round(yearTotals.get(currentYear)?.purchases || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Total Depreciation</p>
              <p className="text-2xl font-bold text-red-600">
                €{Math.round(grandTotal - (yearTotals.get(currentYear)?.depreciated || 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Categories Tracked</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.size}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Total Value
                </th>
                {years.map(year => (
                  <th
                    key={year}
                    className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-r border-gray-300 ${
                      year === currentYear
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-700"
                    }`}
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.sort((a, b) => b.totalValue - a.totalValue).map((catData) => (
                <tr key={catData.category} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                    {catData.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 border-r border-gray-200">
                    €{Math.round(catData.totalValue).toLocaleString()}
                  </td>
                  {years.map(year => {
                    const yearData = catData.years.get(year);
                    const value = yearData?.depreciatedValue || 0;
                    const purchases = yearData?.newPurchases || 0;
                    
                    return (
                      <td
                        key={year}
                        className={`px-4 py-3 text-sm text-right border-r border-gray-200 ${
                          year === currentYear ? "bg-blue-50" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            €{Math.round(value).toLocaleString()}
                          </div>
                          {purchases > 0 && (
                            <div className="text-xs text-green-600">
                              +€{Math.round(purchases).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                  TOTAL
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 border-r border-gray-300">
                  €{Math.round(grandTotal).toLocaleString()}
                </td>
                {years.map(year => {
                  const totals = yearTotals.get(year);
                  return (
                    <td
                      key={year}
                      className={`px-4 py-3 text-sm text-right border-r border-gray-300 ${
                        year === currentYear ? "bg-blue-100" : ""
                      }`}
                    >
                      <div>
                        <div className="text-gray-900">
                          €{Math.round(totals?.depreciated || 0).toLocaleString()}
                        </div>
                        {(totals?.purchases || 0) > 0 && (
                          <div className="text-xs text-green-600">
                            +€{Math.round(totals?.purchases || 0).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">Green values</span> = New purchases in that year
            </div>
            <div>
              Depreciation calculated based on installation date and expected lifespan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
