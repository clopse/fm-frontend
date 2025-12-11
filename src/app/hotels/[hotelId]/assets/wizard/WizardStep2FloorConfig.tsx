import { useState } from "react";
import { Building, Copy, Info, ChevronDown, ChevronUp } from "lucide-react";

export interface FloorConfig {
  floorNumber: number | string;
  floorName: string;
  roomCount: number;
  firstRoomNumber: number;
  roomType: "standard" | "suite" | "accessible" | "studio" | "apartment";
  notes?: string;
}

interface WizardStep2Props {
  floors: FloorConfig[];
  onUpdate: (floors: FloorConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
  totalFloors: number;
}

export default function WizardStep2FloorConfig({ 
  floors, 
  onUpdate, 
  onNext, 
  onBack,
  totalFloors 
}: WizardStep2Props) {
  const [expandedFloor, setExpandedFloor] = useState<number>(0);
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [quickFillRooms, setQuickFillRooms] = useState(30);

  const updateFloor = (index: number, field: keyof FloorConfig, value: any) => {
    const updated = [...floors];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  const applyQuickFill = () => {
    const updated = floors.map((floor, idx) => ({
      ...floor,
      roomCount: quickFillRooms,
      firstRoomNumber: (idx + 1) * 100 + 1,
    }));
    onUpdate(updated);
    setShowQuickFill(false);
  };

  const copyFromFloor = (sourceIndex: number, targetIndex: number) => {
    const updated = [...floors];
    updated[targetIndex] = {
      ...updated[targetIndex],
      roomCount: floors[sourceIndex].roomCount,
      roomType: floors[sourceIndex].roomType,
    };
    onUpdate(updated);
  };

  const getRoomNumbers = (floor: FloorConfig): string => {
    if (floor.roomCount === 0) return "No rooms";
    const first = floor.firstRoomNumber;
    const last = first + floor.roomCount - 1;
    return `${first}-${last}`;
  };

  const totalRooms = floors.reduce((sum, f) => sum + f.roomCount, 0);

  const canProceed = floors.every(f => f.roomCount > 0);

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Floor Configuration</p>
            <p>Configure each floor's room layout. Each floor can have different numbers and types of rooms. Room numbers are automatically generated based on your inputs.</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Floors</p>
          <p className="text-2xl font-bold text-gray-900">{totalFloors}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
          <p className="text-2xl font-bold text-blue-600">{totalRooms}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Avg per Floor</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalFloors > 0 ? Math.round(totalRooms / totalFloors) : 0}
          </p>
        </div>
      </div>

      {/* Quick Fill Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowQuickFill(!showQuickFill)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <Copy className="w-4 h-4 mr-2" />
          Quick Fill All Floors
        </button>
      </div>

      {/* Quick Fill Panel */}
      {showQuickFill && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Quick Fill Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Rooms per floor</label>
              <input
                type="number"
                min="1"
                value={quickFillRooms}
                onChange={(e) => setQuickFillRooms(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={applyQuickFill}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply to All Floors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floor List */}
      <div className="space-y-3">
        {floors.map((floor, idx) => (
          <div 
            key={idx}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Floor Header */}
            <button
              onClick={() => setExpandedFloor(expandedFloor === idx ? -1 : idx)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <Building className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    Floor {floor.floorNumber}: {floor.floorName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {floor.roomCount} rooms ({getRoomNumbers(floor)})
                  </p>
                </div>
              </div>
              {expandedFloor === idx ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Floor Details */}
            {expandedFloor === idx && (
              <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor Name
                    </label>
                    <input
                      type="text"
                      value={floor.floorName}
                      onChange={(e) => updateFloor(idx, "floorName", e.target.value)}
                      placeholder={`Floor ${floor.floorNumber}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <select
                      value={floor.roomType}
                      onChange={(e) => updateFloor(idx, "roomType", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="standard">Standard Room</option>
                      <option value="suite">Suite</option>
                      <option value="accessible">Accessible Room</option>
                      <option value="studio">Studio (Aparthotel)</option>
                      <option value="apartment">Apartment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Rooms *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={floor.roomCount}
                      onChange={(e) => updateFloor(idx, "roomCount", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Room Number *
                    </label>
                    <input
                      type="number"
                      value={floor.firstRoomNumber}
                      onChange={(e) => updateFloor(idx, "firstRoomNumber", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Rooms will be: {getRoomNumbers(floor)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={floor.notes || ""}
                      onChange={(e) => updateFloor(idx, "notes", e.target.value)}
                      placeholder="e.g., Executive floor, Family rooms, Connecting doors"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Copy from previous floor */}
                {idx > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => copyFromFloor(idx - 1, idx)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy configuration from Floor {floors[idx - 1].floorNumber}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next: Select Room Items
        </button>
      </div>
    </div>
  );
}
