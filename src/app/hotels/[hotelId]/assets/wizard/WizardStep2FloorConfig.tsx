import { useState } from "react";
import { Building, Copy, Info, ChevronDown, ChevronUp, Ban } from "lucide-react";

export interface FloorConfig {
  floorNumber: number | string;
  floorName: string;
  roomCount: number;
  firstRoomNumber: number;
  roomType: "standard" | "suite" | "accessible" | "studio" | "apartment";
  notes?: string;
  noRooms?: boolean; // Flag for floors without guest rooms (BOH/public areas only)
  skipRoomNumbers?: number[]; // Array of room numbers to skip (e.g., [310, 311, 312])
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
    const updated = floors.map((floor, idx) => {
      // Skip floors marked as no rooms
      if (floor.noRooms) return floor;
      
      return {
        ...floor,
        roomCount: quickFillRooms,
        firstRoomNumber: typeof floor.floorNumber === 'number' && floor.floorNumber > 0 
          ? floor.floorNumber * 100 + 1 
          : (idx + 1) * 100 + 1,
      };
    });
    onUpdate(updated);
    setShowQuickFill(false);
  };

  const copyFromFloor = (sourceIndex: number, targetIndex: number) => {
    const updated = [...floors];
    updated[targetIndex] = {
      ...updated[targetIndex],
      roomCount: floors[sourceIndex].roomCount,
      roomType: floors[sourceIndex].roomType,
      noRooms: floors[sourceIndex].noRooms,
    };
    onUpdate(updated);
  };

  const getRoomNumbers = (floor: FloorConfig): string => {
    if (floor.noRooms) return "No guest rooms";
    if (floor.roomCount === 0) return "Not configured";
    
    const first = floor.firstRoomNumber;
    const last = first + floor.roomCount - 1;
    const skipCount = floor.skipRoomNumbers?.length || 0;
    
    if (skipCount > 0) {
      return `${first}-${last} (${floor.roomCount - skipCount} rooms, ${skipCount} skipped)`;
    }
    
    return `${first}-${last}`;
  };

  const totalRooms = floors.reduce((sum, f) => f.noRooms ? sum : sum + f.roomCount, 0);
  const floorsWithRooms = floors.filter(f => !f.noRooms).length;
  const floorsWithoutRooms = floors.filter(f => f.noRooms).length;

  // At least one floor must have rooms configured
  const canProceed = totalRooms > 0;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Floor Configuration</p>
            <p>Configure each floor's room layout. Mark floors as "no guest rooms" if they only contain back of house areas, restaurants, or public spaces. Each floor with guest rooms can have different numbers and types of rooms.</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Guest Room Floors</p>
          <p className="text-2xl font-bold text-gray-900">{floorsWithRooms}</p>
          {floorsWithoutRooms > 0 && (
            <p className="text-xs text-gray-500 mt-1">{floorsWithoutRooms} floor(s) without rooms</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
          <p className="text-2xl font-bold text-blue-600">{totalRooms}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Avg per Floor</p>
          <p className="text-2xl font-bold text-gray-900">
            {floorsWithRooms > 0 ? Math.round(totalRooms / floorsWithRooms) : 0}
          </p>
        </div>
      </div>

      {/* Quick Fill Button */}
      {floorsWithRooms > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowQuickFill(!showQuickFill)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            Quick Fill All Floors
          </button>
        </div>
      )}

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
              <p className="text-xs text-gray-500 mt-1">
                Applies only to floors with guest rooms
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={applyQuickFill}
                className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
              >
                Apply to All Guest Floors
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
            className={`bg-white border rounded-lg overflow-hidden ${
              floor.noRooms ? 'border-gray-300' : 'border-gray-200'
            }`}
          >
            {/* Floor Header */}
            <button
              onClick={() => setExpandedFloor(expandedFloor === idx ? -1 : idx)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                {floor.noRooms ? (
                  <Ban className="w-5 h-5 text-gray-400" />
                ) : (
                  <Building className="w-5 h-5 text-gray-400" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900 flex items-center">
                    Floor {floor.floorNumber}: {floor.floorName}
                    {floor.noRooms && (
                      <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        No Rooms
                      </span>
                    )}
                  </p>
                  <p className={`text-sm ${floor.noRooms ? 'text-gray-400' : 'text-gray-500'}`}>
                    {floor.noRooms ? 'Back of house / Public areas only' : (
                      floor.roomCount > 0 
                        ? `${floor.roomCount} rooms (${getRoomNumbers(floor)})` 
                        : 'Not configured'
                    )}
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
                {/* No Rooms Checkbox */}
                <div className="pt-4 pb-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={floor.noRooms || false}
                      onChange={(e) => {
                        updateFloor(idx, "noRooms", e.target.checked);
                        if (e.target.checked) {
                          updateFloor(idx, "roomCount", 0);
                        }
                      }}
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-accent"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">
                      No guest rooms on this floor
                    </span>
                  </label>
                  <p className="ml-6 text-xs text-gray-500 mt-1">
                    Check this for floors with only back of house areas, restaurants, spa, or public spaces
                  </p>
                </div>

                {/* Room Configuration Fields */}
                <div className={`grid grid-cols-2 gap-4 ${floor.noRooms ? 'opacity-40' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor Name
                    </label>
                    <input
                      type="text"
                      value={floor.floorName}
                      onChange={(e) => updateFloor(idx, "floorName", e.target.value)}
                      placeholder={`Floor ${floor.floorNumber}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <select
                      value={floor.roomType}
                      onChange={(e) => updateFloor(idx, "roomType", e.target.value)}
                      disabled={floor.noRooms}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      Number of Rooms {!floor.noRooms && '*'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={floor.roomCount}
                      onChange={(e) => updateFloor(idx, "roomCount", parseInt(e.target.value) || 0)}
                      disabled={floor.noRooms}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Room Number {!floor.noRooms && '*'}
                    </label>
                    <input
                      type="number"
                      value={floor.firstRoomNumber}
                      onChange={(e) => updateFloor(idx, "firstRoomNumber", parseInt(e.target.value) || 0)}
                      disabled={floor.noRooms}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {!floor.noRooms && floor.roomCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rooms will be: {getRoomNumbers(floor)}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skip Room Numbers (Optional)
                      </label>
                      {!floor.noRooms && floor.roomCount > 0 && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Generate odd numbers only (skip even)
                              const first = floor.firstRoomNumber;
                              const evens = [];
                              for (let i = 0; i < floor.roomCount; i++) {
                                const num = first + i;
                                if (num % 2 === 0) evens.push(num);
                              }
                              updateFloor(idx, "skipRoomNumbers", evens);
                            }}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                          >
                            Odd Only
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Generate even numbers only (skip odd)
                              const first = floor.firstRoomNumber;
                              const odds = [];
                              for (let i = 0; i < floor.roomCount; i++) {
                                const num = first + i;
                                if (num % 2 === 1) odds.push(num);
                              }
                              updateFloor(idx, "skipRoomNumbers", odds);
                            }}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                          >
                            Even Only
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFloor(idx, "skipRoomNumbers", [])}
                            className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={(floor.skipRoomNumbers || []).join(', ')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          updateFloor(idx, "skipRoomNumbers", []);
                        } else {
                          const numbers = value
                            .split(',')
                            .map(n => parseInt(n.trim()))
                            .filter(n => !isNaN(n));
                          updateFloor(idx, "skipRoomNumbers", numbers);
                        }
                      }}
                      disabled={floor.noRooms}
                      placeholder="e.g., 310, 311, 313 (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Skip specific room numbers (e.g., odd/even layout, unlucky numbers, or layout gaps)
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
                      placeholder={floor.noRooms ? "e.g., Lobby, Restaurant, Spa, Back of house" : "e.g., Executive floor, Family rooms, Connecting doors"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
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

      {/* Validation Warning */}
      {totalRooms === 0 && (
        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">At least one floor must have guest rooms</p>
              <p className="mt-1">Configure room counts for floors with guest accommodations to continue.</p>
            </div>
          </div>
        </div>
      )}

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
          className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next: Select Room Items
        </button>
      </div>
    </div>
  );
}
