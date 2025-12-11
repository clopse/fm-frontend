// src/app/hotels/[hotelId]/asset-wizard/page.tsx
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type RoomRange = {
  floorLabel: string;    // "1", "2", "B1" etc
  startRoom: number;     // 101
  endRoom: number;       // 134
};

type RoomTypeKey = "standard" | "twin" | "accessible" | "studio" | "apartment" | "suite";

type RoomTypeDefinition = {
  key: RoomTypeKey;
  label: string;
  appliesTo: RoomRange[];  // which floors/rooms use this type
  includes: {
    bedCount: number;
    mattressPerBed: boolean;
    wardrobe: boolean;
    desk: boolean;
    deskChair: boolean;
    sofa: boolean;
    tvInRoom: boolean;
    miniFridge: boolean;
    safe: boolean;
    kettle: boolean;
    iron: boolean;
    ironingBoard: boolean;
    hairdryer: boolean;
    kitchenette: boolean;
    carpetBedroom: boolean;
  };
};

type PlantAndLiftsConfig = {
  passengerLifts: {
    count: number;
    floorsServedExample: string; // free text for now
  };
  goodsLifts: {
    count: number;
  };
  heatingType: "gas_boilers" | "electric_boilers" | "vrf" | "district" | "other" | "";
  hasFanCoilsInRooms: boolean;
  approxFanCoilInstallYear?: number;
  approxAhuCount?: number;
};

type FireAndLifeSafetyConfig = {
  hasFireAlarmPanel: boolean;
  fireAlarmInstallYear?: number;
  hasSprinklers: "none" | "partial" | "full";
  hasDryRisers: boolean;
  hasEmergencyLighting: boolean;
};

type PublicAreasConfig = {
  hasMeetingRooms: boolean;
  meetingRoomCount: number;
  hasRestaurantBar: boolean;
  hasMainKitchen: boolean;
};

type CapexProject = {
  name: string;
  year: number | "";
  category: "bedroom_ffe" | "public_ffe" | "plant_mep" | "fire_life_safety" | "it_av" | "";
  appliesToDescription: string; // free text for now; later we can structure it
};

type WizardState = {
  hotelBasics: {
    hotelId: string;
    hotelName: string;
    brand: string;
    openingYear: number | "";
  };
  floorsAndRooms: {
    guestroomFloorCount: number | "";
    roomRanges: RoomRange[];
  };
  roomTypes: RoomTypeDefinition[];
  plantAndLifts: PlantAndLiftsConfig;
  fireAndLifeSafety: FireAndLifeSafetyConfig;
  publicAreas: PublicAreasConfig;
  capexProjects: CapexProject[];
};

type WizardStepId =
  | "hotelBasics"
  | "floorsAndRooms"
  | "roomTypes"
  | "plantAndLifts"
  | "fireAndLifeSafety"
  | "publicAreas"
  | "capexProjects"
  | "summary";

type WizardStep = {
  id: WizardStepId;
  title: string;
};

const steps: WizardStep[] = [
  { id: "hotelBasics", title: "Hotel basics" },
  { id: "floorsAndRooms", title: "Floors and rooms" },
  { id: "roomTypes", title: "Room types and contents" },
  { id: "plantAndLifts", title: "Plant and lifts" },
  { id: "fireAndLifeSafety", title: "Fire and life safety" },
  { id: "publicAreas", title: "Public areas" },
  { id: "capexProjects", title: "Capex (last 2 years)" },
  { id: "summary", title: "Summary and generate" },
];

function createEmptyWizardState(hotelId: string): WizardState {
  return {
    hotelBasics: {
      hotelId,
      hotelName: "",
      brand: "",
      openingYear: "",
    },
    floorsAndRooms: {
      guestroomFloorCount: "",
      roomRanges: [],
    },
    roomTypes: [
      {
        key: "standard",
        label: "Standard room",
        appliesTo: [],
        includes: {
          bedCount: 1,
          mattressPerBed: true,
          wardrobe: true,
          desk: true,
          deskChair: true,
          sofa: false,
          tvInRoom: true,
          miniFridge: false,
          safe: true,
          kettle: true,
          iron: true,
          ironingBoard: true,
          hairdryer: true,
          kitchenette: false,
          carpetBedroom: true,
        },
      },
    ],
    plantAndLifts: {
      passengerLifts: { count: 0, floorsServedExample: "" },
      goodsLifts: { count: 0 },
      heatingType: "",
      hasFanCoilsInRooms: false,
      approxFanCoilInstallYear: undefined,
      approxAhuCount: undefined,
    },
    fireAndLifeSafety: {
      hasFireAlarmPanel: true,
      fireAlarmInstallYear: undefined,
      hasSprinklers: "none",
      hasDryRisers: false,
      hasEmergencyLighting: true,
    },
    publicAreas: {
      hasMeetingRooms: false,
      meetingRoomCount: 0,
      hasRestaurantBar: true,
      hasMainKitchen: true,
    },
    capexProjects: [],
  };
}

export default function AssetWizardPage() {
  const params = useParams<{ hotelId: string }>();
  const hotelIdFromRoute = params?.hotelId as string;

  const [wizardState, setWizardState] = useState<WizardState>(
    createEmptyWizardState(hotelIdFromRoute),
  );
  const [currentStepId, setCurrentStepId] = useState<WizardStepId>("hotelBasics");
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing wizard config from backend (stub)
  useEffect(() => {
    async function loadConfig() {
      try {
        setError(null);
        const res = await fetch(`/api/hotels/${hotelIdFromRoute}/asset-wizard/config`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.config) {
            setWizardState(data.config as WizardState);
          } else {
            setWizardState(createEmptyWizardState(hotelIdFromRoute));
          }
        } else {
          // if 404, just start fresh
          if (res.status === 404) {
            setWizardState(createEmptyWizardState(hotelIdFromRoute));
          } else {
            setError("Failed to load wizard config");
          }
        }
      } catch (e) {
        setError("Error loading wizard config");
      } finally {
        setHasLoaded(true);
      }
    }

    if (hotelIdFromRoute) {
      loadConfig();
    }
  }, [hotelIdFromRoute]);

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch(`/api/hotels/${hotelIdFromRoute}/asset-wizard/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: wizardState }),
      });
      if (!res.ok) {
        setError("Failed to save wizard config");
      }
    } catch (e) {
      setError("Error saving wizard config");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateAssets() {
    try {
      setIsSaving(true);
      setError(null);
      const res = await fetch(`/api/hotels/${hotelIdFromRoute}/asset-wizard/generate-assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: wizardState }),
      });
      if (!res.ok) {
        setError("Failed to generate assets");
      } else {
        // later: maybe redirect to /hotels/[hotelId]/assets
      }
    } catch (e) {
      setError("Error generating assets");
    } finally {
      setIsSaving(false);
    }
  }

  function goToStep(stepId: WizardStepId) {
    setCurrentStepId(stepId);
  }

  function nextStep() {
    const idx = steps.findIndex((s) => s.id === currentStepId);
    if (idx >= 0 && idx < steps.length - 1) {
      setCurrentStepId(steps[idx + 1].id);
    }
  }

  function previousStep() {
    const idx = steps.findIndex((s) => s.id === currentStepId);
    if (idx > 0) {
      setCurrentStepId(steps[idx - 1].id);
    }
  }

  if (!hasLoaded) {
    return (
      <div className="p-6">
        <p>Loading asset wizard…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4 mb-4">
        <h1 className="text-xl">Asset Register Wizard</h1>
        <p className="text-sm text-gray-600">
          Hotel ID: {hotelIdFromRoute} – a guided setup to generate your asset register.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-6">
        {/* Stepper */}
        <nav className="w-64 border-r pr-4 space-y-2">
          {steps.map((step) => {
            const isActive = step.id === currentStepId;
            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`block w-full text-left text-sm px-3 py-2 rounded ${
                  isActive ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                {step.title}
              </button>
            );
          })}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full text-sm border px-3 py-2 rounded"
            >
              {isSaving ? "Saving…" : "Save progress"}
            </button>
            <button
              onClick={handleGenerateAssets}
              disabled={isSaving}
              className="w-full text-sm border px-3 py-2 rounded"
            >
              Generate assets
            </button>
          </div>
        </nav>

        {/* Step content */}
        <div className="flex-1 space-y-4">
          {currentStepId === "hotelBasics" && (
            <HotelBasicsStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "floorsAndRooms" && (
            <FloorsAndRoomsStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "roomTypes" && (
            <RoomTypesStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "plantAndLifts" && (
            <PlantAndLiftsStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "fireAndLifeSafety" && (
            <FireAndLifeSafetyStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "publicAreas" && (
            <PublicAreasStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "capexProjects" && (
            <CapexProjectsStep
              state={wizardState}
              onChange={setWizardState}
            />
          )}

          {currentStepId === "summary" && (
            <SummaryStep
              state={wizardState}
            />
          )}

          <div className="flex justify-between pt-4 border-t mt-4">
            <button
              onClick={previousStep}
              className="text-sm border px-3 py-2 rounded"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              className="text-sm border px-3 py-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step components – minimal for now

type StepProps = {
  state: WizardState;
  onChange: (next: WizardState) => void;
};

function HotelBasicsStep({ state, onChange }: StepProps) {
  const basics = state.hotelBasics;
  function update<K extends keyof typeof basics>(key: K, value: (typeof basics)[K]) {
    onChange({ ...state, hotelBasics: { ...basics, [key]: value } });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg">Hotel basics</h2>
      <div className="space-y-2">
        <label className="block text-sm">
          Hotel name
          <input
            className="mt-1 block w-full border px-2 py-1 rounded text-sm"
            value={basics.hotelName}
            onChange={(e) => update("hotelName", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Brand
          <input
            className="mt-1 block w-full border px-2 py-1 rounded text-sm"
            value={basics.brand}
            onChange={(e) => update("brand", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Opening year or last major refurb year
          <input
            type="number"
            className="mt-1 block w-full border px-2 py-1 rounded text-sm"
            value={basics.openingYear}
            onChange={(e) =>
              update("openingYear", e.target.value ? Number(e.target.value) : "")
            }
          />
        </label>
      </div>
    </div>
  );
}

function FloorsAndRoomsStep({ state, onChange }: StepProps) {
  const fr = state.floorsAndRooms;

  function updateRoomRange(index: number, patch: Partial<RoomRange>) {
    const nextRanges = fr.roomRanges.map((r, i) =>
      i === index ? { ...r, ...patch } : r,
    );
    onChange({ ...state, floorsAndRooms: { ...fr, roomRanges: nextRanges } });
  }

  function addRoomRange() {
    const nextRanges = [
      ...fr.roomRanges,
      { floorLabel: "", startRoom: 0, endRoom: 0 },
    ];
    onChange({ ...state, floorsAndRooms: { ...fr, roomRanges: nextRanges } });
  }

  function removeRoomRange(index: number) {
    const nextRanges = fr.roomRanges.filter((_, i) => i !== index);
    onChange({ ...state, floorsAndRooms: { ...fr, roomRanges: nextRanges } });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg">Floors and room ranges</h2>
      <p className="text-sm text-gray-600">
        Define how your rooms are numbered, for example 101–134 on floor 1, 201–234 on floor 2.
      </p>

      <div className="space-y-3">
        {fr.roomRanges.map((range, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm">
                Floor label
                <input
                  className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                  value={range.floorLabel}
                  onChange={(e) => updateRoomRange(idx, { floorLabel: e.target.value })}
                />
              </label>
            </div>
            <div className="w-28">
              <label className="block text-sm">
                Start room
                <input
                  type="number"
                  className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                  value={range.startRoom || ""}
                  onChange={(e) =>
                    updateRoomRange(idx, {
                      startRoom: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                />
              </label>
            </div>
            <div className="w-28">
              <label className="block text-sm">
                End room
                <input
                  type="number"
                  className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                  value={range.endRoom || ""}
                  onChange={(e) =>
                    updateRoomRange(idx, {
                      endRoom: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeRoomRange(idx)}
              className="text-xs border px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRoomRange}
        className="text-sm border px-3 py-1 rounded"
      >
        Add room range
      </button>
    </div>
  );
}

// For now, the remaining steps are placeholders; we can flesh them out next

function RoomTypesStep({ state }: StepProps) {
  return (
    <div>
      <h2 className="text-lg">Room types and contents</h2>
      <p className="text-sm text-gray-600">
        Here we will define what each room type contains (bed, TV, safe, etc.) and which rooms use each type.
      </p>
      <p className="text-sm mt-2">
        For now this is a placeholder; next iteration we will add fields and auto-generation logic.
      </p>
    </div>
  );
}

function PlantAndLiftsStep({}: StepProps) {
  return (
    <div>
      <h2 className="text-lg">Plant and lifts</h2>
      <p className="text-sm text-gray-600">
        Passenger lifts, goods lifts, boilers, AHUs, fan coils and heating type will be configured here.
      </p>
    </div>
  );
}

function FireAndLifeSafetyStep({}: StepProps) {
  return (
    <div>
      <h2 className="text-lg">Fire and life safety</h2>
      <p className="text-sm text-gray-600">
        Fire alarm panels, sprinklers, emergency lighting and dry risers will be captured in this step.
      </p>
    </div>
  );
}

function PublicAreasStep({}: StepProps) {
  return (
    <div>
      <h2 className="text-lg">Public areas</h2>
      <p className="text-sm text-gray-600">
        Meeting rooms, restaurant/bar and main kitchen equipment will be defined here.
      </p>
    </div>
  );
}

function CapexProjectsStep({ state, onChange }: StepProps) {
  const projects = state.capexProjects;

  function updateProject(index: number, patch: Partial<CapexProject>) {
    const next = projects.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ ...state, capexProjects: next });
  }

  function addProject() {
    const next = [
      ...projects,
      { name: "", year: "", category: "", appliesToDescription: "" as string },
    ];
    onChange({ ...state, capexProjects: next });
  }

  function removeProject(index: number) {
    const next = projects.filter((_, i) => i !== index);
    onChange({ ...state, capexProjects: next });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg">Capex projects (last 2 years)</h2>
      <p className="text-sm text-gray-600">
        Add major projects like “Beds 2025”, “TVs 2024”, “AHU upgrade 2023”. We will use these to set install years and capex references.
      </p>

      <div className="space-y-3">
        {projects.map((p, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2">
            <div className="flex gap-2">
              <label className="flex-1 text-sm">
                Project name
                <input
                  className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                  value={p.name}
                  onChange={(e) => updateProject(idx, { name: e.target.value })}
                />
              </label>
              <label className="w-28 text-sm">
                Year
                <input
                  type="number"
                  className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                  value={p.year}
                  onChange={(e) =>
                    updateProject(idx, {
                      year: e.target.value ? Number(e.target.value) : "",
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              Category
              <select
                className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                value={p.category}
                onChange={(e) =>
                  updateProject(idx, { category: e.target.value as CapexProject["category"] })
                }
              >
                <option value="">Select category</option>
                <option value="bedroom_ffe">Bedroom FF&E</option>
                <option value="public_ffe">Public area FF&E</option>
                <option value="plant_mep">Plant / MEP</option>
                <option value="fire_life_safety">Fire / life safety</option>
                <option value="it_av">IT / AV</option>
              </select>
            </label>
            <label className="block text-sm">
              Where did this apply? (floors, room ranges, areas)
              <textarea
                className="mt-1 block w-full border px-2 py-1 rounded text-sm"
                rows={2}
                value={p.appliesToDescription}
                onChange={(e) => updateProject(idx, { appliesToDescription: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() => removeProject(idx)}
              className="text-xs border px-2 py-1 rounded"
            >
              Remove project
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addProject}
        className="text-sm border px-3 py-1 rounded"
      >
        Add project
      </button>
    </div>
  );
}

function SummaryStep({ state }: { state: WizardState }) {
  const totalRoomRanges = state.floorsAndRooms.roomRanges.length;
  const totalProjects = state.capexProjects.length;

  return (
    <div className="space-y-3">
      <h2 className="text-lg">Summary</h2>
      <p className="text-sm text-gray-600">
        Quick check before generating the asset register.
      </p>
      <ul className="text-sm list-disc pl-5 space-y-1">
        <li>Hotel: {state.hotelBasics.hotelName || state.hotelBasics.hotelId}</li>
        <li>Room ranges defined: {totalRoomRanges}</li>
        <li>Room types configured: {state.roomTypes.length}</li>
        <li>Capex projects listed: {totalProjects}</li>
      </ul>
      <p className="text-sm text-gray-600 mt-2">
        When you click “Generate assets” in the sidebar, the backend will convert this config into a full asset register.
      </p>
    </div>
  );
}
