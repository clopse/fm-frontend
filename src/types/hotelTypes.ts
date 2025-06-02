// FILE: src/types/hotelTypes.ts

export interface FireSafetyEquipment {
  fireExtinguishers: number;
  smokeDetectors: number;
  fireAlarmPanels: number;
  sprinklerHeads: number;
  dryRisers: number;
  wetRisers: number;
  fireHoseReels: number; // UK/Irish spelling
  emergencyLighting: number;
  exitSigns: number;
  fireDoorsCount: number;
  fireBlankets: number;
  co2Extinguishers: number;
  foamExtinguishers: number;
}

export interface MechanicalSystems {
  elevators: number; // Called "lifts" in UK/Ireland but keeping elevators for clarity
  escalators: number;
  dumbwaiters: number;
  hvacUnits: number;
  boilers: number;
  chillers: number;
  generators: number;
  waterHeaters: number; // Could also be "immersion heaters"
  poolPumps: number;
  exhaustFans: number;
  ansulSystems: number;
  commercialKitchens: number;
}

export interface UtilitySystems {
  gasMeters: number;
  electricalPanels: number; // Could be "consumer units" in UK/Ireland
  waterMeters: number;
  sewerConnections: number;
  greaseTrapSize: string; // In litres
  waterTankCapacity: string; // In litres
  emergencyWaterSupply: boolean;
  backupGeneratorCapacity: string; // In kW
  thermostaticMixingValves: number; // TMVs - important for Legionella prevention
}

export interface StructuralInfo {
  floors: number; // Called "storeys" in UK/Ireland
  basements: number;
  totalRooms: number;
  suites: number;
  yearBuilt: number;
  lastMajorRenovation?: number;
  totalSquareMetres: number; // Changed from square footage to square metres
  buildingHeightMetres: number; // Changed from feet to metres
  constructionType: string;
  roofType: string;
  foundationType: string;
}

export interface ComplianceRequirements {
  requiresAnsulService: boolean;
  requiresElevatorInspection: boolean; // Called "lift inspection" in UK/Ireland
  requiresBoilerInspection: boolean;
  requiresFireSystemInspection: boolean;
  requiresPoolInspection: boolean;
  requiresKitchenHoodCleaning: boolean;
  requiresBackflowTesting: boolean;
  requiresGreaseTrapService: boolean; // Fixed typo from "Grasee"
  requiresGeneratorService: boolean;
  requiresHVACService: boolean;
  requiresLegionellaRiskAssessment: boolean; // Important for UK/Ireland
  requiresGasSafetyCertificate: boolean; // Gas Safe Register requirement
  requiresPATTesting: boolean; // Portable Appliance Testing
  requiresEICRCertificate: boolean; // Electrical Installation Condition Report
}

export interface HotelFacilityData {
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  county: string; // Changed from "state" to "county" for UK/Ireland
  postCode: string; // Changed from "zipCode" to "postCode"
  phone: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  
  structural: StructuralInfo;
  fireSafety: FireSafetyEquipment;
  mechanical: MechanicalSystems;
  utilities: UtilitySystems;
  compliance: ComplianceRequirements;
  
  lastUpdated: string;
  updatedBy: string;
  setupComplete: boolean;
}

export interface ServiceContract {
  name: string;
  equipment: string;
  frequency: string;
  icon: any;
  color: string;
}

// Default values
export const defaultFireSafety: FireSafetyEquipment = {
  fireExtinguishers: 0,
  smokeDetectors: 0,
  fireAlarmPanels: 0,
  sprinklerHeads: 0,
  dryRisers: 0,
  wetRisers: 0,
  fireHoseReels: 0, // Fixed spelling
  emergencyLighting: 0,
  exitSigns: 0,
  fireDoorsCount: 0,
  fireBlankets: 0,
  co2Extinguishers: 0,
  foamExtinguishers: 0
};

export const defaultMechanical: MechanicalSystems = {
  elevators: 0,
  escalators: 0,
  dumbwaiters: 0,
  hvacUnits: 0,
  boilers: 0,
  chillers: 0,
  generators: 0,
  waterHeaters: 0,
  poolPumps: 0,
  exhaustFans: 0,
  ansulSystems: 0,
  commercialKitchens: 0
};

export const defaultUtilities: UtilitySystems = {
  gasMeters: 0,
  electricalPanels: 0,
  waterMeters: 0,
  sewerConnections: 0,
  greaseTrapSize: '', // Will be in litres
  waterTankCapacity: '', // Will be in litres  
  emergencyWaterSupply: false,
  backupGeneratorCapacity: '', // Will be in kW
  thermostaticMixingValves: 0
};

export const defaultStructural: StructuralInfo = {
  floors: 1,
  basements: 0,
  totalRooms: 0,
  suites: 0,
  yearBuilt: new Date().getFullYear(),
  totalSquareMetres: 0, // Changed from square footage
  buildingHeightMetres: 0, // Changed from feet
  constructionType: '',
  roofType: '',
  foundationType: ''
};

export const defaultCompliance: ComplianceRequirements = {
  requiresAnsulService: false,
  requiresElevatorInspection: false,
  requiresBoilerInspection: false,
  requiresFireSystemInspection: false,
  requiresPoolInspection: false,
  requiresKitchenHoodCleaning: false,
  requiresBackflowTesting: false,
  requiresGreaseTrapService: false, // Fixed typo
  requiresGeneratorService: false,
  requiresHVACService: false,
  requiresLegionellaRiskAssessment: false,
  requiresGasSafetyCertificate: false,
  requiresPATTesting: false,
  requiresEICRCertificate: false
};

// Factory function to create default hotel data
export function createDefaultHotelData(id: string, name: string): HotelFacilityData {
  return {
    hotelId: id,
    hotelName: name,
    address: '',
    city: '',
    county: '', // Changed from state
    postCode: '', // Changed from zipCode
    phone: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    structural: { ...defaultStructural },
    fireSafety: { ...defaultFireSafety },
    mechanical: { ...defaultMechanical },
    utilities: { ...defaultUtilities },
    compliance: { ...defaultCompliance },
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System',
    setupComplete: false
  };
}
