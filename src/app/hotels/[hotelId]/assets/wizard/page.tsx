"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import WizardStep1HotelConfig from "./WizardStep1HotelConfig";
import WizardStep2FloorConfig, { FloorConfig } from "./WizardStep2FloorConfig";
import WizardStep3ItemSelection, { STANDARD_ITEMS } from "./WizardStep3ItemSelection";
import WizardStep4Review from "./WizardStep4Review";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface HotelConfig {
  hotelName: string;
  hotelCode: string;
  totalFloors: number;
  hasBasement: boolean;
  hasGroundFloor: boolean;
  openingDate: string;
  propertyType: "hotel" | "aparthotel" | "serviced_apartments";
}

interface AssetCreate {
  asset_code: string;
  hotel_id: string;
  location?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  quantity?: number;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  supplier?: string | null;
  installation_date?: string | null;
  purchase_cost?: number | null;
  expected_lifespan_years?: number | null;
  capex_or_opex?: string | null;
  status?: string | null;
  condition?: string | null;
  created_by?: string | null;
}

// Helper function to auto-generate floors array from hotel configuration
function generateFloorsArray(config: HotelConfig): FloorConfig[] {
  const floors: FloorConfig[] = [];
  
  // Add basement if it exists
  if (config.hasBasement) {
    floors.push({
      floorNumber: 'B',
      floorName: 'Basement',
      roomCount: 0,
      firstRoomNumber: -101, // or 1 for B01, B02 numbering
      roomType: 'standard',
      notes: '',
      noRooms: true // Default to no rooms, user can change in Step 2
    });
  }
  
  // Add ground floor if it exists
  if (config.hasGroundFloor) {
    floors.push({
      floorNumber: 0,
      floorName: 'Ground Floor',
      roomCount: 0,
      firstRoomNumber: 1, // or 001 depending on numbering scheme
      roomType: 'standard',
      notes: '',
      noRooms: true // Default to no rooms (usually lobby/restaurant)
    });
  }
  
  // Add numbered floors (1 through totalFloors)
  for (let i = 1; i <= config.totalFloors; i++) {
    floors.push({
      floorNumber: i,
      floorName: `Floor ${i}`,
      roomCount: 30, // Default 30 rooms per floor
      firstRoomNumber: i * 100 + 1, // 101, 201, 301, etc.
      roomType: 'standard',
      notes: '',
      noRooms: false // Guest floors have rooms by default
    });
  }
  
  return floors;
}

export default function AssetWizardPage() {
  const params = useParams<{ hotelId: string }>();
  const router = useRouter();
  const hotelId = params?.hotelId as string;

  const [step, setStep] = useState(1);

  // Step 1 - Hotel configuration
  const [hotelConfig, setHotelConfig] = useState<HotelConfig>({
    hotelName: "",
    hotelCode: hotelId ? hotelId.toUpperCase() : "",
    totalFloors: 4,
    hasBasement: false,
    hasGroundFloor: false,
    openingDate: new Date().toISOString().split('T')[0],
    propertyType: "hotel",
  });

  // Step 2 - Floor configuration
  const [floors, setFloors] = useState<FloorConfig[]>([]);

  // Initialize floors when hotel config changes
  useEffect(() => {
    if (hotelConfig.totalFloors > 0) {
      const generatedFloors = generateFloorsArray(hotelConfig);
      setFloors(generatedFloors);
    }
  }, [hotelConfig.totalFloors, hotelConfig.hasBasement, hotelConfig.hasGroundFloor]);

  // Step 3 - Item selection
  const [selectedItems, setSelectedItems] = useState<string[]>([
    "bed",
    "mattress",
    "tv",
    "wardrobe",
    "desk",
    "desk_chair",
    "wc",
    "basin",
    "shower",
  ]);

  const [itemCosts, setItemCosts] = useState<Record<string, number>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({}); // NEW

  // Calculate totals - exclude floors with noRooms flag
  const totalRooms = floors.reduce((sum, f) => f.noRooms ? sum : sum + f.roomCount, 0);
  
  const selectedItemsData = STANDARD_ITEMS.filter(item => 
    selectedItems.includes(item.key)
  );

  const totalCostPerRoom = selectedItemsData.reduce((sum, item) => {
    const cost = itemCosts[item.key] ?? item.defaultCost;
    const quantity = itemQuantities[item.key] ?? 1; // NEW
    return sum + (cost * quantity);
  }, 0);

  // Generate room numbers for all floors (excluding floors with noRooms)
  const generateAllRoomNumbers = (): Array<{ room: number; floor: FloorConfig }> => {
    const rooms: Array<{ room: number; floor: FloorConfig }> = [];
    
    for (const floor of floors) {
      // Skip floors marked as having no guest rooms
      if (floor.noRooms) continue;
      
      const first = floor.firstRoomNumber;
      for (let i = 0; i < floor.roomCount; i++) {
        rooms.push({
          room: first + i,
          floor,
        });
      }
    }
    
    return rooms;
  };

  // Generate all assets with quantity support
  const generateAssets = (): AssetCreate[] => {
    const rooms = generateAllRoomNumbers();
    const assets: AssetCreate[] = [];

    for (const { room, floor } of rooms) {
      for (const key of selectedItems) {
        const item = STANDARD_ITEMS.find(i => i.key === key);
        if (!item) continue;

        const cost = itemCosts[item.key] ?? item.defaultCost;
        const quantity = itemQuantities[item.key] ?? 1; // NEW

        // Create multiple assets if quantity > 1
        for (let q = 1; q <= quantity; q++) {
          const shortKey = item.subcategory.replace(/\s+/g, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
          const suffix = quantity > 1 ? `-${q}` : ""; // Add suffix for multiple items
          const assetCode = `${hotelConfig.hotelCode}-RM${room}-${shortKey}${suffix}`;

          assets.push({
            asset_code: assetCode,
            hotel_id: hotelConfig.hotelCode.toLowerCase(),
            location: `Room ${room} - ${floor.floorName}`,
            category: item.category,
            subcategory: item.subcategory,
            description: quantity > 1 
              ? `${item.label} #${q} in ${floor.roomType} room ${room}`
              : `${item.label} in ${floor.roomType} room ${room}`,
            quantity: 1, // Each asset is quantity 1 (we create multiple assets)
            status: "Active",
            condition: "Unknown",
            capex_or_opex: "CAPEX",
            installation_date: hotelConfig.openingDate,
            purchase_cost: cost,
            expected_lifespan_years: item.estimatedLifeYears,
            created_by: "asset_wizard",
          });
        }
      }
    }

    return assets;
  };

  // Generate assets and save to API
  const handleGenerate = async () => {
    if (!API_BASE) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const assets = generateAssets();
    
    // Chunk the requests to avoid overwhelming the API
    const chunkSize = 50;
    const chunks: AssetCreate[][] = [];
    
    for (let i = 0; i < assets.length; i += chunkSize) {
      chunks.push(assets.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(asset =>
          fetch(`${API_BASE}/assets/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(asset),
          }).then(res => {
            if (!res.ok) {
              return res.text().then(text => {
                throw new Error(
                  `Failed to create asset ${asset.asset_code}: ${res.status} ${text}`
                );
              });
            }
          })
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Asset Register Setup Wizard
              </h1>
              <p className="text-gray-600 mt-1">
                Create your complete asset register in 4 simple steps
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-between">
            {[
              { num: 1, label: "Hotel Info" },
              { num: 2, label: "Floor Layout" },
              { num: 3, label: "Room Items" },
              { num: 4, label: "Review" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step >= s.num
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s.num}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      step >= s.num ? "text-blue-600 font-medium" : "text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`h-1 flex-1 -mt-8 transition-colors ${
                      step > s.num ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {step === 1 && (
            <WizardStep1HotelConfig
              config={hotelConfig}
              onUpdate={setHotelConfig}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <WizardStep2FloorConfig
              floors={floors}
              onUpdate={setFloors}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              totalFloors={floors.length}
            />
          )}

          {step === 3 && (
            <WizardStep3ItemSelection
              selectedItems={selectedItems}
              itemCosts={itemCosts}
              itemQuantities={itemQuantities}
              onUpdateSelection={setSelectedItems}
              onUpdateCost={(key, cost) => setItemCosts({ ...itemCosts, [key]: cost })}
              onUpdateQuantity={(key, qty) => setItemQuantities({ ...itemQuantities, [key]: qty })}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
              propertyType={hotelConfig.propertyType}
              totalRooms={totalRooms}
            />
          )}

          {step === 4 && (
            <WizardStep4Review
              hotelName={hotelConfig.hotelName}
              hotelCode={hotelConfig.hotelCode}
              floors={floors}
              selectedItems={selectedItemsData.map(item => ({
                label: item.label,
                cost: itemCosts[item.key] ?? item.defaultCost,
                category: item.category,
                estimatedLifeYears: item.estimatedLifeYears,
              }))}
              totalRooms={totalRooms}
              totalCostPerRoom={totalCostPerRoom}
              onBack={() => setStep(3)}
              onGenerate={handleGenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
