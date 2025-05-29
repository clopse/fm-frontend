// FILE: src/types/hotelTypes.ts

export interface FireSafetyEquipment {
  fireExtinguishers: number;
  smokeDetectors: number;
  fireAlarmPanels: number;
  sprinklerHeads: number;
  dryRisers: number;
  wetRisers: number;
  fireHosesReels: number;
  emergencyLighting: number;
  exitSigns: number;
  fireDoorsCount: number;
  fireBlankets: number;
  co2Extinguishers: number;
  foamExtinguishers: number;
}

export interface MechanicalSystems {
  elevators: number;
  escalators: number;
  dumbwaiters: number;
  hvacUnits: number;
  boilers: number;
  chillers: number;
  generators: number;
  waterHeaters: number;
  poolPumps: number;
  exhaustFans: number;
  ansulSystems: number;
  commercialKitchens: number;
}

export interface UtilitySystems {
  gasMeters: number;
  electricalPanels: number;
  waterMeters: number;
  sewerConnections: number;
  greaseTrapSize: string;
  waterTankCapacity: string;
  emergencyWaterSupply: boolean;
  backupGeneratorCapacity: string;
}

export interface StructuralInfo {
  floors: number;
  basements: number;
  totalRooms: number;
  suites: number;
  yearBuilt: number;
  lastMajorRenovation?: number;
  totalSquareFootage: number;
  buildingHeight: number;
  constructionType: string;
  roofType: string;
  foundationType: string;
}

export interface ComplianceRequirements {
  requiresAnsulService: boolean;
  requiresElevatorInspection: boolean;
  requiresBoilerInspection: boolean;
  requiresFireSystemInspection: boolean;
  requiresPoolInspection: boolean;
  requiresKitchenHoodCleaning: boolean;
  requiresBackflowTesting: boolean;
  requiresGraseeTrapService: boolean;
  requiresGeneratorService: boolean;
  requiresHVACService: boolean;
}

export interface HotelFacilityData {
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
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
  fireHosesReels: 0,
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
  greaseTrapSize: '',
  waterTankCapacity: '',
  emergencyWaterSupply: false,
  backupGeneratorCapacity: ''
};

export const defaultStructural: StructuralInfo = {
  floors: 1,
  basements: 0,
  totalRooms: 0,
  suites: 0,
  yearBuilt: new Date().getFullYear(),
  totalSquareFootage: 0,
  buildingHeight: 0,
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
  requiresGraseeTrapService: false,
  requiresGeneratorService: false,
  requiresHVACService: false
};

// Factory function to create default hotel data
export function createDefaultHotelData(id: string, name: string): HotelFacilityData {
  return {
    hotelId: id,
    hotelName: name,
    address: '',
    city: '',
    state: '',
    zipCode: '',
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
