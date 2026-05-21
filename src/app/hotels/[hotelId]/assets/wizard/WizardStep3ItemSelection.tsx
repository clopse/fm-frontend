import { useState } from "react";
import { Info, Plus, Minus, Upload, FileText } from "lucide-react";

export const STANDARD_ITEMS = [
  // Bedroom Items
  { key: "bed", label: "Bed Frame", category: "Bedrooms", subcategory: "Bed frame", defaultCost: 450, estimatedLifeYears: 10 },
  { key: "mattress", label: "Mattress", category: "Bedrooms", subcategory: "Mattress", defaultCost: 380, estimatedLifeYears: 7 },
  { key: "tv", label: "Television", category: "Bedrooms", subcategory: "Television", defaultCost: 600, estimatedLifeYears: 7 },
  { key: "tv_remote", label: "TV Remote", category: "Bedrooms", subcategory: "TV Remote", defaultCost: 15, estimatedLifeYears: 3 },
  { key: "wardrobe", label: "Wardrobe", category: "Bedrooms", subcategory: "Wardrobe", defaultCost: 350, estimatedLifeYears: 12 },
  { key: "desk", label: "Desk", category: "Bedrooms", subcategory: "Desk", defaultCost: 280, estimatedLifeYears: 10 },
  { key: "desk_chair", label: "Desk Chair", category: "Bedrooms", subcategory: "Desk chair", defaultCost: 120, estimatedLifeYears: 8 },
  { key: "bedside_table", label: "Bedside Table", category: "Bedrooms", subcategory: "Bedside table", defaultCost: 85, estimatedLifeYears: 10 },
  { key: "lamp", label: "Lamp", category: "Bedrooms", subcategory: "Lamp", defaultCost: 45, estimatedLifeYears: 5 },
  { key: "safe", label: "Safe", category: "Bedrooms", subcategory: "Safe", defaultCost: 220, estimatedLifeYears: 15 },
  { key: "door_lock", label: "Electronic Door Lock", category: "Bedrooms", subcategory: "Door lock", defaultCost: 380, estimatedLifeYears: 10 },
  { key: "mirror_bedroom", label: "Mirror - Bedroom", category: "Bedrooms", subcategory: "Mirror - bedroom", defaultCost: 65, estimatedLifeYears: 15 },
  { key: "curtains_blackout", label: "Curtains - Blackout", category: "Bedrooms", subcategory: "Curtains - blackout", defaultCost: 180, estimatedLifeYears: 7 },
  { key: "curtains_sheer", label: "Curtains - Sheer", category: "Bedrooms", subcategory: "Curtains - sheer", defaultCost: 95, estimatedLifeYears: 5 },
  
  // Bathroom Items
  { key: "wc", label: "Toilet", category: "Bathrooms", subcategory: "WC", defaultCost: 320, estimatedLifeYears: 20 },
  { key: "basin", label: "Basin", category: "Bathrooms", subcategory: "Basin", defaultCost: 280, estimatedLifeYears: 20 },
  { key: "shower", label: "Shower", category: "Bathrooms", subcategory: "Shower", defaultCost: 450, estimatedLifeYears: 15 },
  { key: "bath", label: "Bath", category: "Bathrooms", subcategory: "Bath", defaultCost: 680, estimatedLifeYears: 20 },
  { key: "shower_screen", label: "Shower Screen", category: "Bathrooms", subcategory: "Shower screen", defaultCost: 280, estimatedLifeYears: 10 },
  { key: "mirror_bathroom", label: "Mirror - Bathroom", category: "Bathrooms", subcategory: "Mirror - bathroom", defaultCost: 85, estimatedLifeYears: 15 },
  { key: "extractor_fan", label: "Extractor Fan", category: "Bathrooms", subcategory: "Extractor fan", defaultCost: 120, estimatedLifeYears: 10 },
  
  // HVAC Items
  { key: "ac_unit", label: "AC Unit", category: "HVAC", subcategory: "AC unit", defaultCost: 850, estimatedLifeYears: 12 },
  { key: "radiator", label: "Radiator", category: "HVAC", subcategory: "Radiator", defaultCost: 280, estimatedLifeYears: 20 },
  
  // Kitchen (Aparthotel)
  { key: "fridge", label: "Fridge", category: "Kitchen", subcategory: "Fridge", defaultCost: 480, estimatedLifeYears: 10 },
  { key: "microwave", label: "Microwave", category: "Kitchen", subcategory: "Microwave", defaultCost: 120, estimatedLifeYears: 7 },
  { key: "hob", label: "Hob", category: "Kitchen", subcategory: "Hob", defaultCost: 380, estimatedLifeYears: 12 },
  { key: "oven", label: "Oven", category: "Kitchen", subcategory: "Oven", defaultCost: 550, estimatedLifeYears: 12 },
  { key: "dishwasher", label: "Dishwasher", category: "Kitchen", subcategory: "Dishwasher", defaultCost: 480, estimatedLifeYears: 10 },
  { key: "kettle", label: "Kettle", category: "Kitchen", subcategory: "Kettle", defaultCost: 35, estimatedLifeYears: 3 },
];

interface WizardStep3Props {
  selectedItems: string[];
  itemCosts: Record<string, number>;
  itemQuantities: Record<string, number>; // NEW
  onUpdateSelection: (items: string[]) => void;
  onUpdateCost: (key: string, cost: number) => void;
  onUpdateQuantity: (key: string, quantity: number) => void; // NEW
  onNext: () => void;
  onBack: () => void;
  propertyType: "hotel" | "aparthotel" | "serviced_apartments";
  totalRooms: number;
}

export default function WizardStep3ItemSelection({
  selectedItems,
  itemCosts,
  itemQuantities,
  onUpdateSelection,
  onUpdateCost,
  onUpdateQuantity,
  onNext,
  onBack,
  propertyType,
  totalRooms,
}: WizardStep3Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const toggleItem = (key: string) => {
    if (selectedItems.includes(key)) {
      onUpdateSelection(selectedItems.filter(k => k !== key));
    } else {
      onUpdateSelection([...selectedItems, key]);
    }
  };

  // Filter items
  const filteredItems = STANDARD_ITEMS.filter(item => {
    // Filter by property type
    if (propertyType === "hotel" && item.category === "Kitchen") return false;
    
    // Filter by category
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    
    // Filter by search
    if (searchTerm && !item.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const categories = ["All", ...new Set(STANDARD_ITEMS.map(i => i.category))];

  // Calculate totals
  const selectedItemsData = STANDARD_ITEMS.filter(item => selectedItems.includes(item.key));
  const totalCostPerRoom = selectedItemsData.reduce((sum, item) => {
    const cost = itemCosts[item.key] ?? item.defaultCost;
    const qty = itemQuantities[item.key] ?? 1;
    return sum + (cost * qty);
  }, 0);

  const totalAssets = selectedItemsData.reduce((sum, item) => {
    const qty = itemQuantities[item.key] ?? 1;
    return sum + (totalRooms * qty);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Item Selection & Configuration</p>
            <p>Select items for each room. Adjust quantities if some rooms have 2 TVs, 2 beds, etc. Set costs and you can bulk update later.</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Items Selected</p>
          <p className="text-2xl font-bold text-blue-600">{selectedItems.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Cost Per Room</p>
          <p className="text-2xl font-bold text-gray-900">€{totalCostPerRoom.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Assets</p>
          <p className="text-2xl font-bold text-gray-900">{totalAssets.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-green-600">€{(totalCostPerRoom * totalRooms).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map(item => {
          const isSelected = selectedItems.includes(item.key);
          const cost = itemCosts[item.key] ?? item.defaultCost;
          const quantity = itemQuantities[item.key] ?? 1;

          return (
            <div
              key={item.key}
              className={`bg-white border-2 rounded-lg p-4 transition-all ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleItem(item.key)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-accent"
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">
                        {item.category} • {item.estimatedLifeYears} year lifespan
                      </p>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-6">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-gray-600 font-medium">Qty per room:</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => quantity > 1 && onUpdateQuantity(item.key, quantity - 1)}
                              disabled={quantity <= 1}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button
                              onClick={() => quantity < 5 && onUpdateQuantity(item.key, quantity + 1)}
                              disabled={quantity >= 5}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Cost Input */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600 font-medium">Cost:</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <input
                              type="number"
                              value={cost}
                              onChange={(e) => onUpdateCost(item.key, parseFloat(e.target.value) || 0)}
                              className="w-24 pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
                            />
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            €{(cost * quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Tip:</strong> Don't worry about getting everything perfect! After creating assets, you can use <strong>Bulk Management</strong> to:
        </p>
        <ul className="text-sm text-yellow-800 mt-2 ml-4 space-y-1">
          <li>• Update prices for all TVs at once (€600 → €500)</li>
          <li>• Add manuals to all items of same type</li>
          <li>• Update manufacturer/model details later</li>
          <li>• Handle special cases (Room 601 has 2 TVs)</li>
        </ul>
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
          disabled={selectedItems.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next: Review & Generate
        </button>
      </div>
    </div>
  );
}
