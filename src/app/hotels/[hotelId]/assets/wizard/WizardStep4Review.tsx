import { useState } from "react";
import { FileCheck, AlertCircle, CheckCircle, Download, Loader } from "lucide-react";

interface ReviewProps {
  hotelName: string;
  hotelCode: string;
  floors: Array<{
    floorNumber: number | string;
    floorName: string;
    roomCount: number;
    roomType: string;
  }>;
  selectedItems: Array<{
    label: string;
    cost: number;
    category: string;
    estimatedLifeYears: number;
  }>;
  totalRooms: number;
  totalCostPerRoom: number;
  onBack: () => void;
  onGenerate: () => Promise<void>;
}

export default function WizardStep4Review({
  hotelName,
  hotelCode,
  floors,
  selectedItems,
  totalRooms,
  totalCostPerRoom,
  onBack,
  onGenerate,
}: ReviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const totalPropertyValue = totalCostPerRoom * totalRooms;
  const totalAssets = totalRooms * selectedItems.length;
  const averageAssetLife = selectedItems.reduce((sum, item) => sum + item.estimatedLifeYears, 0) / selectedItems.length;

  // Calculate insurance categories breakdown
  const categoryBreakdown = selectedItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, value: 0 };
    }
    acc[item.category].count += totalRooms;
    acc[item.category].value += item.cost * totalRooms;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      await onGenerate();
      setGenerationComplete(true);
    } catch (error: any) {
      setGenerationError(error.message || "Failed to generate assets");
    } finally {
      setIsGenerating(false);
    }
  };

  if (generationComplete) {
    return (
      <div className="space-y-6">
        <div className="border-l-4 border-green-500 bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">
                Asset Register Created Successfully!
              </h3>
              <p className="text-green-700">
                {totalAssets.toLocaleString()} assets have been generated for {hotelName}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Review and refine asset details (manufacturer, model, serial numbers)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Upload warranty documents and commissioning certificates</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Set up maintenance schedules and service contracts</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Add photos and technical documentation</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Configure insurance policies based on asset values</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Start New Wizard
          </button>
          <button
            onClick={() => window.location.href = `/hotels/${hotelCode}/assets`}
            className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover"
          >
            View Asset Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <div className="flex items-start">
          <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Review Configuration</p>
            <p>Please review your configuration before generating the asset register. This process will create {totalAssets.toLocaleString()} individual asset records.</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Rooms</p>
          <p className="text-3xl font-bold text-gray-900">{totalRooms}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Items Per Room</p>
          <p className="text-3xl font-bold text-gray-900">{selectedItems.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Assets</p>
          <p className="text-3xl font-bold text-blue-600">{totalAssets.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Life</p>
          <p className="text-3xl font-bold text-gray-900">{averageAssetLife.toFixed(1)}<span className="text-lg text-gray-500">yr</span></p>
        </div>
      </div>

      {/* Valuation Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-200 text-sm mb-2">Cost Per Room</p>
            <p className="text-4xl font-bold">€{totalCostPerRoom.toLocaleString()}</p>
            <p className="text-blue-200 text-xs mt-1">Replacement value</p>
          </div>

          <div>
            <p className="text-blue-200 text-sm mb-2">Total Property Value</p>
            <p className="text-4xl font-bold">€{totalPropertyValue.toLocaleString()}</p>
            <p className="text-blue-200 text-xs mt-1">FF&E + Equipment</p>
          </div>

          <div>
            <p className="text-blue-200 text-sm mb-2">Insurance Premium Est.</p>
            <p className="text-4xl font-bold">€{Math.round(totalPropertyValue * 0.0035).toLocaleString()}</p>
            <p className="text-blue-200 text-xs mt-1">Annual @ 0.35% rate</p>
          </div>
        </div>
      </div>

      {/* Hotel Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Hotel Configuration</h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Property Name</p>
            <p className="font-medium text-gray-900">{hotelName}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Hotel Code</p>
            <p className="font-medium text-gray-900 font-mono">{hotelCode}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Total Floors</p>
            <p className="font-medium text-gray-900">{floors.length}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Total Guest Rooms</p>
            <p className="font-medium text-gray-900">{totalRooms}</p>
          </div>
        </div>
      </div>

      {/* Floor Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Floor Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {floors.map((floor, idx) => (
            <div key={idx} className="px-6 py-3 flex justify-between items-center text-sm">
              <div>
                <span className="font-medium text-gray-900">
                  Floor {floor.floorNumber}: {floor.floorName}
                </span>
                <span className="text-gray-500 ml-2">({floor.roomType})</span>
              </div>
              <span className="font-medium text-gray-900">{floor.roomCount} rooms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Asset Category Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(categoryBreakdown)
            .sort((a, b) => b[1].value - a[1].value)
            .map(([category, data]) => (
              <div key={category} className="px-6 py-3 flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-900 min-w-[120px]">{category}</span>
                  <span className="text-gray-500">{data.count.toLocaleString()} units</span>
                </div>
                <span className="font-medium text-gray-900">
                  €{data.value.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Selected Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Selected Items ({selectedItems.length})</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {selectedItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">{item.label}</span>
                <span className="font-medium text-gray-900">€{item.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">Important Notes</p>
            <ul className="space-y-1 text-xs">
              <li>• This will create {totalAssets.toLocaleString()} individual asset records in your database</li>
              <li>• All assets will be marked with "Active" status and "Unknown" condition initially</li>
              <li>• You can update individual asset details (serial numbers, models, etc.) after creation</li>
              <li>• Installation dates will be set to the hotel opening date you specified</li>
              <li>• This process cannot be undone, but assets can be edited or deleted individually</li>
            </ul>
          </div>
        </div>
      </div>

      {generationError && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Generation Failed</p>
              <p>{generationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Generating Assets...</span>
            </>
          ) : (
            <>
              <FileCheck className="w-5 h-5" />
              <span>Generate Asset Register</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
