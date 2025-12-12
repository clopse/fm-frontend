"use client";

import { X, Download } from "lucide-react";
import { useState } from "react";

interface Asset {
  id: number;
  asset_code: string;
  category: string | null;
  purchase_cost: number | null;
  installation_date: string | null;
  expected_lifespan_years: number | null;
  quantity: number;
  location: string | null;
  description: string | null;
}

interface DepreciationTrackerProps {
  assets: Asset[];
  onClose: () => void;
}

interface YearData {
  year: number;
  depreciatedValue: number;
  newPurchases: number;
  assets: Asset[]; // Track which assets contribute
}

interface CategoryDepreciation {
  category: string;
  years: Map<number, YearData>;
  totalValue: number;
}

interface AssetListPopupProps {
  assets: Asset[];
  category: string;
  year: number;
  onClose: () => void;
}

function AssetListPopup({ assets, category, year, onClose }: AssetListPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {category} - {year}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {assets.length} asset{assets.length !== 1 ? 's' : ''} contributing to this value
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
        
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Asset Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Purchase Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Installed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Age</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Current Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assets.map((asset) => {
                const installYear = asset.installation_date ? new Date(asset.installation_date).getFullYear() : null;
                const age = installYear ? year - installYear : null;
                const totalCost = (asset.purchase_cost || 0) * asset.quantity;
                const depreciationRate = age && asset.expected_lifespan_years 
                  ? Math.min(age / asset.expected_lifespan_years, 1)
                  : 0;
                const currentValue = totalCost * (1 - depreciationRate);
                
                return (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{asset.asset_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{asset.location || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{asset.description || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      €{(asset.purchase_cost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{asset.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {asset.installation_date 
                        ? new Date(asset.installation_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {age !== null ? `${age} yr` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      €{Math.round(currentValue).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  Total:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  €{Math.round(
                    assets.reduce((sum, a) => {
                      const installYear = a.installation_date ? new Date(a.installation_date).getFullYear() : null;
                      const age = installYear ? year - installYear : null;
                      const totalCost = (a.purchase_cost || 0) * a.quantity;
                      const depreciationRate = age && a.expected_lifespan_years 
                        ? Math.min(age / a.expected_lifespan_years, 1)
                        : 0;
                      return sum + (totalCost * (1 - depreciationRate));
                    }, 0)
                  ).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DepreciationTracker({ assets, onClose }: DepreciationTrackerProps) {
  const currentYear = new Date().getFullYear();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCell, setSelectedCell] = useState<{ category: string; year: number; assets: Asset[] } | null>(null);

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

    const years: number[] = [];
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
            assets: [],
          });
        }

        const yearData = catData.years.get(year)!;

        // Add asset to this year's list
        yearData.assets.push(asset);

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
  const yearTotals = new Map<number, { depreciated: number; purchases: number; assets: Asset[] }>();
  years.forEach(year => {
    let depreciated = 0;
    let purchases = 0;
    const allAssets: Asset[] = [];
    
    categories.forEach(catData => {
      const yearData = catData.years.get(year);
      if (yearData) {
        depreciated += yearData.depreciatedValue;
        purchases += yearData.newPurchases;
        allAssets.push(...yearData.assets);
      }
    });

    yearTotals.set(year, { depreciated, purchases, assets: allAssets });
  });

  const grandTotal = Array.from(categories.values()).reduce((sum, cat) => sum + cat.totalValue, 0);

  const exportToExcel = () => {
    // Create detailed asset list with yearly depreciation values
    const headers = [
      "Asset Code",
      "Category",
      "Location",
      "Description",
      "Purchase Cost",
      "Quantity",
      "Installation Date",
      "Lifespan (years)",
      "Total Cost",
      ...years.map(y => y.toString())
    ];
    const rows: string[][] = [];

    // Filter assets based on selected category
    const assetsToExport = selectedCategory === "All" 
      ? assets 
      : assets.filter(a => (a.category || "Uncategorized") === selectedCategory);

    // Process each asset
    assetsToExport
      .filter(asset => asset.purchase_cost && asset.installation_date && asset.expected_lifespan_years)
      .forEach(asset => {
        const installYear = new Date(asset.installation_date!).getFullYear();
        const totalCost = asset.purchase_cost! * asset.quantity;
        
        const row = [
          asset.asset_code,
          asset.category || "Uncategorized",
          asset.location || "",
          asset.description || "",
          Math.round(asset.purchase_cost!).toString(),
          asset.quantity.toString(),
          asset.installation_date!,
          asset.expected_lifespan_years!.toString(),
          Math.round(totalCost).toString(),
        ];
        
        // Add yearly depreciated values
        years.forEach(year => {
          const yearsOwned = year - installYear;
          
          if (yearsOwned < 0) {
            // Not yet installed
            row.push("0");
          } else if (yearsOwned >= asset.expected_lifespan_years!) {
            // Fully depreciated
            row.push("0");
          } else {
            // Calculate remaining value
            const depreciationRate = yearsOwned / asset.expected_lifespan_years!;
            const remainingValue = totalCost * (1 - depreciationRate);
            
            // Show new purchase indicator
            if (year === installYear) {
              row.push(`${Math.round(remainingValue)} (NEW)`);
            } else {
              row.push(Math.round(remainingValue).toString());
            }
          }
        });
        
        rows.push(row);
      });

    // Add totals row
    const totalsRow = [
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      Math.round(
        assetsToExport
          .filter(a => a.purchase_cost)
          .reduce((sum, a) => sum + a.purchase_cost! * a.quantity, 0)
      ).toString(),
    ];
    
    years.forEach(year => {
      const total = assetsToExport
        .filter(a => a.purchase_cost && a.installation_date && a.expected_lifespan_years)
        .reduce((sum, asset) => {
          const installYear = new Date(asset.installation_date!).getFullYear();
          const yearsOwned = year - installYear;
          const totalCost = asset.purchase_cost! * asset.quantity;
          
          if (yearsOwned < 0 || yearsOwned >= asset.expected_lifespan_years!) {
            return sum;
          }
          
          const depreciationRate = yearsOwned / asset.expected_lifespan_years!;
          const remainingValue = totalCost * (1 - depreciationRate);
          return sum + remainingValue;
        }, 0);
      
      totalsRow.push(Math.round(total).toString());
    });
    
    rows.push(totalsRow);

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        if (cell.includes(",") || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(","))
    ].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const categoryFilter = selectedCategory === "All" ? "all" : selectedCategory.toLowerCase().replace(/\s+/g, "-");
    link.download = `depreciation-asset-list-${categoryFilter}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCellClick = (category: string, year: number, assets: Asset[]) => {
    if (assets.length > 0) {
      setSelectedCell({ category, year, assets });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Depreciation Tracker</h2>
              <p className="text-blue-100 text-sm mt-1">
                Asset value depreciation by year and category • Click cells to see asset details
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
            <div className="flex items-center gap-4">
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
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </button>
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
                    const assetsInCell = yearData?.assets || [];
                    
                    return (
                      <td
                        key={year}
                        onClick={() => handleCellClick(catData.category, year, assetsInCell)}
                        className={`px-4 py-3 text-sm text-right border-r border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors ${
                          year === currentYear ? "bg-blue-50" : ""
                        }`}
                        title={assetsInCell.length > 0 ? `Click to see ${assetsInCell.length} assets` : "No assets"}
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
                      onClick={() => handleCellClick("All Categories", year, totals?.assets || [])}
                      className={`px-4 py-3 text-sm text-right border-r border-gray-300 cursor-pointer hover:bg-blue-200 transition-colors ${
                        year === currentYear ? "bg-blue-100" : ""
                      }`}
                      title={`Click to see all ${totals?.assets.length || 0} assets`}
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
              <span className="font-medium">Green values</span> = New purchases in that year • 
              <span className="font-medium ml-2">Click any cell</span> to see contributing assets
            </div>
            <div>
              Depreciation based on installation date and expected lifespan
            </div>
          </div>
        </div>
      </div>

      {/* Asset List Popup */}
      {selectedCell && (
        <AssetListPopup
          assets={selectedCell.assets}
          category={selectedCell.category}
          year={selectedCell.year}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}
