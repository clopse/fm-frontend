import { useState } from "react";
import { Search, Info, DollarSign, TrendingUp } from "lucide-react";

export interface StandardItem {
  key: string;
  label: string;
  category: string;
  subcategory: string;
  area: "Bedroom" | "Appliances" | "Kitchen" | "Living/Dining" | "Bathroom" | "Other";
  defaultCost: number;
  estimatedLifeYears: number;
  insuranceCategory: "Contents" | "FF&E" | "Equipment" | "Fixed";
}

// Extended item list with cost data
export const STANDARD_ITEMS: StandardItem[] = [
  // Bedroom furniture
  { key: "bed", label: "Bed Frame", category: "Bedrooms", subcategory: "Bed", area: "Bedroom", defaultCost: 450, estimatedLifeYears: 10, insuranceCategory: "FF&E" },
  { key: "mattress", label: "Mattress", category: "Bedrooms", subcategory: "Mattress", area: "Bedroom", defaultCost: 380, estimatedLifeYears: 7, insuranceCategory: "FF&E" },
  { key: "headboard", label: "Headboard", category: "Bedrooms", subcategory: "Headboard", area: "Bedroom", defaultCost: 220, estimatedLifeYears: 10, insuranceCategory: "FF&E" },
  { key: "bedside_lockers", label: "Bedside Lockers (pair)", category: "Bedrooms", subcategory: "Bedside locker", area: "Bedroom", defaultCost: 180, estimatedLifeYears: 10, insuranceCategory: "FF&E" },
  { key: "wardrobe", label: "Wardrobe", category: "Bedrooms", subcategory: "Wardrobe", area: "Bedroom", defaultCost: 520, estimatedLifeYears: 12, insuranceCategory: "FF&E" },
  { key: "luggage_rack", label: "Luggage Rack", category: "Bedrooms", subcategory: "Luggage rack", area: "Bedroom", defaultCost: 85, estimatedLifeYears: 8, insuranceCategory: "Contents" },
  { key: "desk", label: "Desk", category: "Bedrooms", subcategory: "Desk", area: "Bedroom", defaultCost: 320, estimatedLifeYears: 10, insuranceCategory: "FF&E" },
  { key: "desk_chair", label: "Desk Chair", category: "Bedrooms", subcategory: "Desk chair", area: "Bedroom", defaultCost: 145, estimatedLifeYears: 7, insuranceCategory: "FF&E" },
  { key: "armchair", label: "Armchair", category: "Bedrooms", subcategory: "Armchair", area: "Bedroom", defaultCost: 380, estimatedLifeYears: 8, insuranceCategory: "FF&E" },
  { key: "sofa_bed", label: "Sofa Bed", category: "Bedrooms", subcategory: "Sofa bed", area: "Bedroom", defaultCost: 680, estimatedLifeYears: 8, insuranceCategory: "FF&E" },
  { key: "room_carpet", label: "Bedroom Carpet", category: "Bedrooms", subcategory: "Carpet - bedroom", area: "Bedroom", defaultCost: 420, estimatedLifeYears: 5, insuranceCategory: "Fixed" },
  { key: "blackout_curtains", label: "Blackout Curtains", category: "Bedrooms", subcategory: "Curtains - blackout", area: "Bedroom", defaultCost: 160, estimatedLifeYears: 6, insuranceCategory: "Contents" },
  { key: "sheer_curtains", label: "Sheer Curtains", category: "Bedrooms", subcategory: "Curtains - sheer", area: "Bedroom", defaultCost: 95, estimatedLifeYears: 5, insuranceCategory: "Contents" },
  { key: "reading_lights", label: "Reading Lights (pair)", category: "Bedrooms", subcategory: "Light - reading", area: "Bedroom", defaultCost: 120, estimatedLifeYears: 8, insuranceCategory: "Contents" },
  { key: "room_main_light", label: "Main Room Light", category: "Bedrooms", subcategory: "Light - main", area: "Bedroom", defaultCost: 180, estimatedLifeYears: 10, insuranceCategory: "Fixed" },
  { key: "full_length_mirror", label: "Full-Length Mirror", category: "Bedrooms", subcategory: "Mirror - full length", area: "Bedroom", defaultCost: 95, estimatedLifeYears: 12, insuranceCategory: "Contents" },
  { key: "in_room_safe", label: "In-Room Safe", category: "Bedrooms", subcategory: "Safe", area: "Bedroom", defaultCost: 280, estimatedLifeYears: 15, insuranceCategory: "Equipment" },

  // Appliances
  { key: "tv", label: "Television (43\")", category: "Bedrooms", subcategory: "Television", area: "Appliances", defaultCost: 420, estimatedLifeYears: 6, insuranceCategory: "Equipment" },
  { key: "mini_fridge", label: "Mini-Fridge / Minibar", category: "Bedrooms", subcategory: "Fridge - minibar", area: "Appliances", defaultCost: 320, estimatedLifeYears: 8, insuranceCategory: "Equipment" },
  { key: "kettle", label: "Kettle", category: "Bedrooms", subcategory: "Kettle", area: "Appliances", defaultCost: 35, estimatedLifeYears: 4, insuranceCategory: "Contents" },
  { key: "coffee_machine", label: "Coffee Machine", category: "Bedrooms", subcategory: "Coffee machine", area: "Appliances", defaultCost: 85, estimatedLifeYears: 5, insuranceCategory: "Contents" },
  { key: "hairdryer", label: "Hairdryer", category: "Bedrooms", subcategory: "Hairdryer", area: "Appliances", defaultCost: 28, estimatedLifeYears: 4, insuranceCategory: "Contents" },
  { key: "iron", label: "Iron", category: "Bedrooms", subcategory: "Iron", area: "Appliances", defaultCost: 32, estimatedLifeYears: 5, insuranceCategory: "Contents" },
  { key: "ironing_board", label: "Ironing Board", category: "Bedrooms", subcategory: "Ironing board", area: "Appliances", defaultCost: 45, estimatedLifeYears: 8, insuranceCategory: "Contents" },
  { key: "room_thermostat", label: "Room Thermostat", category: "Bedrooms", subcategory: "Room thermostat", area: "Appliances", defaultCost: 185, estimatedLifeYears: 10, insuranceCategory: "Equipment" },
  { key: "keycard_switch", label: "Keycard Power Switch", category: "Bedrooms", subcategory: "Keycard switch", area: "Appliances", defaultCost: 95, estimatedLifeYears: 12, insuranceCategory: "Equipment" },

  // Kitchen (Aparthotel)
  { key: "kitchen_base_units", label: "Kitchen Base Units", category: "Kitchen", subcategory: "Cabinet - base units", area: "Kitchen", defaultCost: 1200, estimatedLifeYears: 15, insuranceCategory: "Fixed" },
  { key: "kitchen_wall_units", label: "Kitchen Wall Units", category: "Kitchen", subcategory: "Cabinet - wall units", area: "Kitchen", defaultCost: 850, estimatedLifeYears: 15, insuranceCategory: "Fixed" },
  { key: "kitchen_worktop", label: "Kitchen Worktop", category: "Kitchen", subcategory: "Worktop", area: "Kitchen", defaultCost: 680, estimatedLifeYears: 12, insuranceCategory: "Fixed" },
  { key: "kitchen_sink", label: "Kitchen Sink & Tap", category: "Kitchen", subcategory: "Sink & tap", area: "Kitchen", defaultCost: 320, estimatedLifeYears: 15, insuranceCategory: "Fixed" },
  { key: "microwave", label: "Microwave", category: "Kitchen", subcategory: "Microwave", area: "Kitchen", defaultCost: 145, estimatedLifeYears: 6, insuranceCategory: "Equipment" },
  { key: "hob", label: "Hob (4 ring)", category: "Kitchen", subcategory: "Hob", area: "Kitchen", defaultCost: 380, estimatedLifeYears: 10, insuranceCategory: "Equipment" },
  { key: "oven", label: "Built-in Oven", category: "Kitchen", subcategory: "Oven", area: "Kitchen", defaultCost: 520, estimatedLifeYears: 10, insuranceCategory: "Equipment" },
  { key: "extractor_hood", label: "Extractor Hood", category: "Kitchen", subcategory: "Extractor hood", area: "Kitchen", defaultCost: 280, estimatedLifeYears: 10, insuranceCategory: "Equipment" },
  { key: "dishwasher", label: "Dishwasher", category: "Kitchen", subcategory: "Dishwasher", area: "Kitchen", defaultCost: 580, estimatedLifeYears: 8, insuranceCategory: "Equipment" },
  { key: "full_fridge_freezer", label: "Full-Height Fridge/Freezer", category: "Kitchen", subcategory: "Fridge-freezer", area: "Kitchen", defaultCost: 680, estimatedLifeYears: 10, insuranceCategory: "Equipment" },
  { key: "washer_dryer", label: "Washer-Dryer", category: "Kitchen", subcategory: "Washer-dryer", area: "Kitchen", defaultCost: 780, estimatedLifeYears: 8, insuranceCategory: "Equipment" },
  { key: "kitchen_small_pack", label: "Kitchen Equipment Pack", category: "Kitchen", subcategory: "Kitchen pack", area: "Kitchen", defaultCost: 220, estimatedLifeYears: 5, insuranceCategory: "Contents" },

  // Living/Dining
  { key: "sofa", label: "Sofa (2-3 seater)", category: "Living", subcategory: "Sofa", area: "Living/Dining", defaultCost: 680, estimatedLifeYears: 8, insuranceCategory: "FF&E" },
  { key: "living_armchair", label: "Armchair (Living)", category: "Living", subcategory: "Armchair", area: "Living/Dining", defaultCost: 380, estimatedLifeYears: 8, insuranceCategory: "FF&E" },
  { key: "coffee_table", label: "Coffee Table", category: "Living", subcategory: "Coffee table", area: "Living/Dining", defaultCost: 220, estimatedLifeYears: 10, insuranceCategory: "FF&E" },
  { key: "dining_table", label: "Dining Table", category: "Living", subcategory: "Dining table", area: "Living/Dining", defaultCost: 420, estimatedLifeYears: 12, insuranceCategory: "FF&E" },
  { key: "dining_chairs", label: "Dining Chairs (set of 4)", category: "Living", subcategory: "Dining chair", area: "Living/Dining", defaultCost: 320, estimatedLifeYears: 10, insuranceCategory: "FF&E" },
  { key: "living_tv", label: "TV (Living Area, 55\")", category: "Living", subcategory: "Television - living", area: "Living/Dining", defaultCost: 620, estimatedLifeYears: 6, insuranceCategory: "Equipment" },

  // Bathroom
  { key: "wc", label: "WC", category: "Bathrooms", subcategory: "WC", area: "Bathroom", defaultCost: 280, estimatedLifeYears: 20, insuranceCategory: "Fixed" },
  { key: "basin", label: "Basin & Tap", category: "Bathrooms", subcategory: "Basin & tap", area: "Bathroom", defaultCost: 320, estimatedLifeYears: 15, insuranceCategory: "Fixed" },
  { key: "shower", label: "Shower Enclosure", category: "Bathrooms", subcategory: "Shower", area: "Bathroom", defaultCost: 680, estimatedLifeYears: 15, insuranceCategory: "Fixed" },
  { key: "bath", label: "Bath", category: "Bathrooms", subcategory: "Bath", area: "Bathroom", defaultCost: 520, estimatedLifeYears: 20, insuranceCategory: "Fixed" },
  { key: "bathroom_mirror", label: "Bathroom Mirror", category: "Bathrooms", subcategory: "Mirror - bathroom", area: "Bathroom", defaultCost: 85, estimatedLifeYears: 12, insuranceCategory: "Contents" },
  { key: "heated_towel_rail", label: "Heated Towel Rail", category: "Bathrooms", subcategory: "Heated towel rail", area: "Bathroom", defaultCost: 220, estimatedLifeYears: 12, insuranceCategory: "Equipment" },
  { key: "bathroom_extractor", label: "Bathroom Extractor Fan", category: "Bathrooms", subcategory: "Extractor fan", area: "Bathroom", defaultCost: 145, estimatedLifeYears: 10, insuranceCategory: "Equipment" },

  // Other
  { key: "router_ap", label: "WiFi Access Point", category: "IT / AV", subcategory: "WiFi access point", area: "Other", defaultCost: 180, estimatedLifeYears: 5, insuranceCategory: "Equipment" },
  { key: "door_lock", label: "Electronic Door Lock", category: "Bedrooms", subcategory: "Door lock", area: "Other", defaultCost: 380, estimatedLifeYears: 10, insuranceCategory: "Equipment" },
];

interface WizardStep3Props {
  selectedItems: string[];
  itemCosts: Record<string, number>;
  onUpdateSelection: (items: string[]) => void;
  onUpdateCost: (itemKey: string, cost: number) => void;
  onNext: () => void;
  onBack: () => void;
  propertyType: string;
  totalRooms: number;
}

export default function WizardStep3ItemSelection({
  selectedItems,
  itemCosts,
  onUpdateSelection,
  onUpdateCost,
  onNext,
  onBack,
  propertyType,
  totalRooms,
}: WizardStep3Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [showCostEdit, setShowCostEdit] = useState(false);

  const toggleItem = (key: string) => {
    if (selectedItems.includes(key)) {
      onUpdateSelection(selectedItems.filter(k => k !== key));
    } else {
      onUpdateSelection([...selectedItems, key]);
    }
  };

  const selectAllInArea = (area: string) => {
    const itemsInArea = filteredItems
      .filter(item => area === "all" || item.area === area)
      .map(item => item.key);
    
    const allSelected = itemsInArea.every(key => selectedItems.includes(key));
    
    if (allSelected) {
      onUpdateSelection(selectedItems.filter(key => !itemsInArea.includes(key)));
    } else {
      const newSelection = [...new Set([...selectedItems, ...itemsInArea])];
      onUpdateSelection(newSelection);
    }
  };

  const areas = ["Bedroom", "Appliances", "Kitchen", "Living/Dining", "Bathroom", "Other"];
  
  const filteredItems = STANDARD_ITEMS.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === "all" || item.area === selectedArea;
    
    // Filter out kitchen/living items for standard hotels
    const matchesPropertyType = propertyType === "hotel" 
      ? !["Kitchen", "Living/Dining"].includes(item.area)
      : true;
    
    return matchesSearch && matchesArea && matchesPropertyType;
  });

  const selectedItemsData = STANDARD_ITEMS.filter(item => selectedItems.includes(item.key));
  
  const totalCostPerRoom = selectedItemsData.reduce((sum, item) => {
    const cost = itemCosts[item.key] ?? item.defaultCost;
    return sum + cost;
  }, 0);

  const totalPropertyValue = totalCostPerRoom * totalRooms;

  const canProceed = selectedItems.length > 0;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Room Item Selection & Costing</p>
            <p>Select standard items for each room and set their costs. These values are used for insurance valuation, depreciation calculations, and property assessment.</p>
          </div>
        </div>
      </div>

      {/* Value Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Items Selected</p>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{selectedItems.length}</p>
          <p className="text-xs text-gray-500 mt-1">per room</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700">Cost Per Room</p>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            €{totalCostPerRoom.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 mt-1">replacement value</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Total Property Value</p>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-900">
            €{totalPropertyValue.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">{totalRooms} rooms</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Areas</option>
          {areas.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>

        <button
          onClick={() => setShowCostEdit(!showCostEdit)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {showCostEdit ? "Hide" : "Edit"} Costs
        </button>
      </div>

      {/* Item Grid */}
      <div className="space-y-4">
        {areas.map(area => {
          const areaItems = filteredItems.filter(item => item.area === area);
          if (areaItems.length === 0) return null;

          const areaSelected = areaItems.filter(item => selectedItems.includes(item.key)).length;
          const allSelected = areaSelected === areaItems.length;

          return (
            <div key={area} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{area}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {areaSelected} of {areaItems.length} selected
                  </span>
                  <button
                    onClick={() => selectAllInArea(area)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {allSelected ? "Deselect" : "Select"} All
                  </button>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {areaItems.map(item => {
                  const isSelected = selectedItems.includes(item.key);
                  const cost = itemCosts[item.key] ?? item.defaultCost;

                  return (
                    <div
                      key={item.key}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleItem(item.key)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.key)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.subcategory} · {item.estimatedLifeYears}yr lifespan
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {showCostEdit && isSelected ? (
                            <input
                              type="number"
                              value={cost}
                              onChange={(e) => onUpdateCost(item.key, parseFloat(e.target.value) || 0)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              €{cost.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.insuranceCategory}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
          Next: Review & Generate
        </button>
      </div>
    </div>
  );
}
