"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type StandardItemKey = string;

type StandardItem = {
  key: StandardItemKey;
  label: string;
  category: string;
  subcategory: string;
  area: "Bedroom" | "Appliances" | "Kitchen" | "Living/Dining" | "Bathroom" | "Other";
};

const STANDARD_ITEMS: StandardItem[] = [
  // Bedroom furniture
  { key: "bed", label: "Bed", category: "Bedrooms", subcategory: "Bed", area: "Bedroom" },
  { key: "mattress", label: "Mattress", category: "Bedrooms", subcategory: "Mattress", area: "Bedroom" },
  { key: "headboard", label: "Headboard", category: "Bedrooms", subcategory: "Headboard", area: "Bedroom" },
  { key: "bedside_lockers", label: "Bedside lockers", category: "Bedrooms", subcategory: "Bedside locker", area: "Bedroom" },
  { key: "wardrobe", label: "Wardrobe", category: "Bedrooms", subcategory: "Wardrobe", area: "Bedroom" },
  { key: "luggage_rack", label: "Luggage rack", category: "Bedrooms", subcategory: "Luggage rack", area: "Bedroom" },
  { key: "desk", label: "Desk", category: "Bedrooms", subcategory: "Desk", area: "Bedroom" },
  { key: "desk_chair", label: "Desk chair", category: "Bedrooms", subcategory: "Desk chair", area: "Bedroom" },
  { key: "armchair", label: "Armchair", category: "Bedrooms", subcategory: "Armchair", area: "Bedroom" },
  { key: "sofa_bed", label: "Sofa bed", category: "Bedrooms", subcategory: "Sofa bed", area: "Bedroom" },
  { key: "room_carpet", label: "Bedroom carpet", category: "Bedrooms", subcategory: "Carpet - bedroom", area: "Bedroom" },
  { key: "room_hard_floor", label: "Bedroom hard floor", category: "Bedrooms", subcategory: "Floor - hard", area: "Bedroom" },
  { key: "blackout_curtains", label: "Blackout curtains", category: "Bedrooms", subcategory: "Curtains - blackout", area: "Bedroom" },
  { key: "sheer_curtains", label: "Sheer curtains", category: "Bedrooms", subcategory: "Curtains - sheer", area: "Bedroom" },
  { key: "reading_lights", label: "Reading lights", category: "Bedrooms", subcategory: "Light - reading", area: "Bedroom" },
  { key: "room_main_light", label: "Main room light", category: "Bedrooms", subcategory: "Light - main", area: "Bedroom" },
  { key: "full_length_mirror", label: "Full-length mirror", category: "Bedrooms", subcategory: "Mirror - full length", area: "Bedroom" },
  { key: "in_room_safe", label: "In-room safe", category: "Bedrooms", subcategory: "Safe", area: "Bedroom" },

  // Appliances (standard hotel rooms)
  { key: "tv", label: "TV", category: "Bedrooms", subcategory: "Television", area: "Appliances" },
  { key: "mini_fridge", label: "Mini-fridge / minibar", category: "Bedrooms", subcategory: "Fridge - minibar", area: "Appliances" },
  { key: "kettle", label: "Kettle", category: "Bedrooms", subcategory: "Kettle", area: "Appliances" },
  { key: "coffee_machine", label: "Coffee machine", category: "Bedrooms", subcategory: "Coffee machine", area: "Appliances" },
  { key: "hairdryer", label: "Hairdryer", category: "Bedrooms", subcategory: "Hairdryer", area: "Appliances" },
  { key: "iron", label: "Iron", category: "Bedrooms", subcategory: "Iron", area: "Appliances" },
  { key: "ironing_board", label: "Ironing board", category: "Bedrooms", subcategory: "Ironing board", area: "Appliances" },
  { key: "room_thermostat", label: "Room thermostat / controller", category: "Bedrooms", subcategory: "Room thermostat", area: "Appliances" },
  { key: "keycard_switch", label: "Keycard power switch", category: "Bedrooms", subcategory: "Keycard switch", area: "Appliances" },

  // Kitchen / aparthotel
  { key: "kitchen_base_units", label: "Kitchen base units", category: "Kitchen", subcategory: "Cabinet - base units", area: "Kitchen" },
  { key: "kitchen_wall_units", label: "Kitchen wall units", category: "Kitchen", subcategory: "Cabinet - wall units", area: "Kitchen" },
  { key: "kitchen_worktop", label: "Kitchen worktop", category: "Kitchen", subcategory: "Worktop", area: "Kitchen" },
  { key: "kitchen_splashback", label: "Kitchen splashback", category: "Kitchen", subcategory: "Splashback", area: "Kitchen" },
  { key: "kitchen_sink", label: "Kitchen sink & tap", category: "Kitchen", subcategory: "Sink & tap", area: "Kitchen" },
  { key: "microwave", label: "Microwave", category: "Kitchen", subcategory: "Microwave", area: "Kitchen" },
  { key: "hob", label: "Hob (2 or 4 ring)", category: "Kitchen", subcategory: "Hob", area: "Kitchen" },
  { key: "oven", label: "Oven", category: "Kitchen", subcategory: "Oven", area: "Kitchen" },
  { key: "extractor_hood", label: "Extractor hood", category: "Kitchen", subcategory: "Extractor hood", area: "Kitchen" },
  { key: "dishwasher", label: "Dishwasher", category: "Kitchen", subcategory: "Dishwasher", area: "Kitchen" },
  { key: "full_fridge_freezer", label: "Full-height fridge/freezer", category: "Kitchen", subcategory: "Fridge-freezer", area: "Kitchen" },
  { key: "washer_dryer", label: "Washer-dryer", category: "Kitchen", subcategory: "Washer-dryer", area: "Kitchen" },
  { key: "kitchen_small_pack", label: "Kitchen equipment pack (pots, pans, etc.)", category: "Kitchen", subcategory: "Kitchen pack", area: "Kitchen" },

  // Living / dining for aparthotels
  { key: "sofa", label: "Sofa", category: "Living", subcategory: "Sofa", area: "Living/Dining" },
  { key: "living_armchair", label: "Armchair (living area)", category: "Living", subcategory: "Armchair", area: "Living/Dining" },
  { key: "coffee_table", label: "Coffee table", category: "Living", subcategory: "Coffee table", area: "Living/Dining" },
  { key: "side_table", label: "Side table", category: "Living", subcategory: "Side table", area: "Living/Dining" },
  { key: "dining_table", label: "Dining table", category: "Living", subcategory: "Dining table", area: "Living/Dining" },
  { key: "dining_chairs", label: "Dining chairs", category: "Living", subcategory: "Dining chair", area: "Living/Dining" },
  { key: "living_tv", label: "TV (living area)", category: "Living", subcategory: "Television - living", area: "Living/Dining" },
  { key: "living_lighting", label: "Living room lighting", category: "Living", subcategory: "Light - living", area: "Living/Dining" },

  // Bathroom
  { key: "wc", label: "WC", category: "Bathrooms", subcategory: "WC", area: "Bathroom" },
  { key: "basin", label: "Basin & tap", category: "Bathrooms", subcategory: "Basin & tap", area: "Bathroom" },
  { key: "shower", label: "Shower enclosure", category: "Bathrooms", subcategory: "Shower", area: "Bathroom" },
  { key: "bath", label: "Bath", category: "Bathrooms", subcategory: "Bath", area: "Bathroom" },
  { key: "shower_screen", label: "Shower screen / curtain", category: "Bathrooms", subcategory: "Shower screen", area: "Bathroom" },
  { key: "bathroom_mirror", label: "Bathroom mirror", category: "Bathrooms", subcategory: "Mirror - bathroom", area: "Bathroom" },
  { key: "towel_rail", label: "Towel rail", category: "Bathrooms", subcategory: "Towel rail", area: "Bathroom" },
  { key: "heated_towel_rail", label: "Heated towel rail", category: "Bathrooms", subcategory: "Heated towel rail", area: "Bathroom" },
  { key: "bathroom_extractor", label: "Bathroom extractor fan", category: "Bathrooms", subcategory: "Extractor fan - bathroom", area: "Bathroom" },
  { key: "bathroom_floor", label: "Bathroom floor finish", category: "Bathrooms", subcategory: "Floor - bathroom", area: "Bathroom" },

  // Other / generic items
  { key: "router_ap", label: "In-room WiFi AP / router", category: "IT / AV", subcategory: "WiFi access point", area: "Other" },
  { key: "door_lock", label: "Electronic door lock", category: "Bedrooms", subcategory: "Door lock", area: "Other" },
];

type AssetCreate = {
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
  capacity?: string | null;
  voltage_phase?: string | null;
  supplier?: string | null;
  installation_date?: string | null;
  purchase_cost?: number | null;
  installation_cost?: number | null;
  capex_or_opex?: string | null;
  expected_lifespan_years?: number | null;
  warranty_start?: string | null;
  warranty_end?: string | null;
  warranty_notes?: string | null;
  maintenance_contractor?: string | null;
  maintenance_frequency?: string | null;
  last_service_date?: string | null;
  next_service_date?: string | null;
  service_contract_reference?: string | null;
  statutory_requirement?: boolean;
  statutory_standard?: string | null;
  condition?: string | null;
  status?: string | null;
  fault_notes?: string | null;
  last_inspection?: string | null;
  om_manual_path?: string | null;
  commissioning_cert_path?: string | null;
  warranty_doc_path?: string | null;
  photos_path?: string | null;
  created_by?: string | null;
};

export default function AssetWizardPage() {
  const params = useParams<{ hotelId: string }>();
  const router = useRouter();
  const hotelId = params?.hotelId as string;

  const [step, setStep] = useState(1);

  // Step 1 – rooms layout
  const [guestFloors, setGuestFloors] = useState<number>(4);
  const [roomsPerFloor, setRoomsPerFloor] = useState<number>(30);
  const [firstRoomOnFirstFloor, setFirstRoomOnFirstFloor] = useState<number>(101);

  // Step 2 – selected items
  const [selectedItems, setSelectedItems] = useState<StandardItemKey[]>([
    "bed",
    "mattress",
    "tv",
    "room_carpet",
    "wc",
    "basin",
    "shower",
  ]);

  // Submit state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const toggleItem = (key: StandardItemKey) => {
    setSelectedItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const generateRoomNumbers = (): number[] => {
    const rooms: number[] = [];
    for (let floor = 0; floor < guestFloors; floor++) {
      const floorBase = Math.floor(firstRoomOnFirstFloor / 100) + floor;
      const first = floorBase * 100 + 1;
      for (let i = 0; i < roomsPerFloor; i++) {
        rooms.push(first + i);
      }
    }
    return rooms;
  };

  const generateAssets = (): AssetCreate[] => {
    const rooms = generateRoomNumbers();
    const now = new Date();

    const assets: AssetCreate[] = [];

    for (const room of rooms) {
      for (const key of selectedItems) {
        const item = STANDARD_ITEMS.find(i => i.key === key);
        if (!item) continue;

        const shortKey = item.subcategory.replace(/\s+/g, "").toUpperCase();
        const assetCode = `${hotelId}-RM${room}-${shortKey}`;

        assets.push({
          asset_code: assetCode,
          hotel_id: hotelId,
          location: `Room ${room}`,
          category: item.category,
          subcategory: item.subcategory,
          description: `${item.label} in guestroom ${room}`,
          quantity: 1,
          status: "Active",
          condition: "Unknown",
          capex_or_opex: "CAPEX",
          installation_date: `${now.getFullYear()}-01-01`,
          expected_lifespan_years: 10,
          statutory_requirement: false,
          created_by: "wizard",
        });
      }
    }

    return assets;
  };

  const handleSave = async () => {
    if (!API_BASE) {
      setSaveError("NEXT_PUBLIC_API_URL is not set");
      return;
    }

    const assets = generateAssets();
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      // Chunk the POSTs so we don’t hammer the API
      const chunks: AssetCreate[][] = [];
      const chunkSize = 20;
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
                    `Failed to create asset ${asset.asset_code}: ${res.status} ${text}`,
                  );
                });
              }
            }),
          ),
        );
      }

      setSaveMessage(`Created ${assets.length} assets.`);
      setTimeout(() => {
        router.push(`/hotels/${hotelId}/assets`);
      }, 1000);
    } catch (err: any) {
      setSaveError(err?.message || "Error creating assets");
    } finally {
      setIsSaving(false);
    }
  };

  const roomsPreview = generateRoomNumbers();

  const groups: StandardItem["area"][] = [
    "Bedroom",
    "Appliances",
    "Kitchen",
    "Living/Dining",
    "Bathroom",
    "Other",
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <header className="border-b pb-4 mb-4">
        <h1 className="text-2xl">Asset setup wizard</h1>
        <p className="text-sm text-gray-600">
          Hotel: {hotelId}. This wizard will generate one asset per room per item. We’ve included
          standard hotel rooms and aparthotel kitchen / living items so you can future-proof it.
        </p>
      </header>

      <div className="flex space-x-4 text-sm">
        <StepBadge active={step === 1} label="1. Floors and rooms" />
        <StepBadge active={step === 2} label="2. Room items" />
        <StepBadge active={step === 3} label="3. Review and generate" />
      </div>

      {step === 1 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg">Guestroom layout</h2>
          <p className="text-sm text-gray-600">
            For now we assume each guest floor has the same number of rooms and a simple numbering
            pattern. Later we can add room types and exceptions per floor.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block mb-1">Number of guestroom floors</label>
              <input
                type="number"
                min={1}
                value={guestFloors}
                onChange={e => setGuestFloors(Number(e.target.value) || 1)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block mb-1">Rooms per floor</label>
              <input
                type="number"
                min={1}
                value={roomsPerFloor}
                onChange={e => setRoomsPerFloor(Number(e.target.value) || 1)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block mb-1">First room number</label>
              <input
                type="number"
                value={firstRoomOnFirstFloor}
                onChange={e =>
                  setFirstRoomOnFirstFloor(Number(e.target.value) || 101)
                }
                className="w-full border rounded px-2 py-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                For example 101 gives 101–130, 201–230, 301–330 etc.
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-600">
            Preview rooms: {roomsPreview.slice(0, 10).join(", ")}
            {roomsPreview.length > 10 ? " ..." : ""}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded"
            >
              Next: room items
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg">Standard items in each unit</h2>
          <p className="text-sm text-gray-600">
            Tick what each standard unit (room / studio / apartment) has. You can mix bedroom,
            kitchen and living items – this keeps it future-proof for aparthotels.
          </p>

          <div className="space-y-4">
            {groups.map(group => {
              const itemsInGroup = STANDARD_ITEMS.filter(i => i.area === group);
              if (!itemsInGroup.length) return null;

              return (
                <div key={group}>
                  <h3 className="text-sm mb-2 text-gray-800">{group}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {itemsInGroup.map(item => (
                      <label
                        key={item.key}
                        className={`flex items-center space-x-2 border rounded px-2 py-2 cursor-pointer ${
                          selectedItems.includes(item.key)
                            ? "bg-blue-50 border-blue-400"
                            : "bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.key)}
                          onChange={() => toggleItem(item.key)}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
            <span>
              Rooms: {roomsPreview.length}, items per room: {selectedItems.length}
            </span>
            <span>
              Total assets to create: {roomsPreview.length * selectedItems.length}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3 py-2 text-sm border rounded"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded"
            >
              Next: review
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg">Review and generate assets</h2>
          <p className="text-sm text-gray-600">
            This will create one asset per room per selected item using the /assets endpoint.
            You can later tweak models, prices and conditions in the asset detail screens.
          </p>

          <ul className="text-sm text-gray-700 space-y-1">
            <li>Hotel: {hotelId}</li>
            <li>Guestroom floors: {guestFloors}</li>
            <li>Rooms per floor: {roomsPerFloor}</li>
            <li>Number of rooms: {roomsPreview.length}</li>
            <li>
              Items per room:{" "}
              {STANDARD_ITEMS.filter(i => selectedItems.includes(i.key))
                .map(i => `${i.area}: ${i.label}`)
                .join(", ") || "none"}
            </li>
            <li>Total assets to create: {roomsPreview.length * selectedItems.length}</li>
          </ul>

          {saveError && (
            <p className="text-sm text-red-600">
              {saveError}
            </p>
          )}
          {saveMessage && (
            <p className="text-sm text-green-700">
              {saveMessage}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-3 py-2 text-sm border rounded"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded disabled:opacity-60"
            >
              {isSaving ? "Creating assets..." : "Generate assets"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepBadge(props: { active: boolean; label: string }) {
  return (
    <div className="flex items-center space-x-2 text-xs">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center border ${
          props.active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600"
        }`}
      >
        {props.label.split(".")[0]}
      </div>
      <span className={props.active ? "text-gray-900" : "text-gray-500"}>
        {props.label}
      </span>
    </div>
  );
}
