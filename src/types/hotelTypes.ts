// FILE: src/types/hotelTypes.ts

export interface FireSafetyEquipment {
  fireExtinguishers: number;
  smokeDetectors: number;
  fireAlarmPanels: number;
  sprinklerHeads: number;
  dryRisers: number;
  wetRisers: number;
  fireHoseReels: number;
  emergencyLighting: number;
  exitSigns: number;
  fireDoorsCount: number;
  fireBlankets: number;
  co2Extinguishers: number;
  foamExtinguishers: number;
  emergencyStairs: number;
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
  greaseTrapSize: string;
  waterTankCapacity: string;
  backupGeneratorCapacity: string;
  thermostaticMixingValves: number;
  numberOfGreaseTraps: number;
  greaseRemovalSupplier: string;
  fogAuditRequired: boolean;
}

export interface StructuralInfo {
  floors: number;
  basements: number;
  totalRooms: number;
  suites: number;
  yearBuilt: number;
  constructionYear: number;
  lastMajorRenovation?: number;
  totalSquareMetres: number;
  buildingHeightMetres: number;
  buildingType: string;
}

export interface ComplianceRequirements {
  requiresAnsulService: boolean;
  requiresElevatorInspection: boolean;
  requiresBoilerInspection: boolean;
  requiresFireSystemInspection: boolean;
  requiresPoolInspection: boolean;
  requiresKitchenHoodCleaning: boolean;
  requiresBackflowTesting: boolean;
  requiresGreaseTrapService: boolean;
  requiresGeneratorService: boolean;
  requiresHVACService: boolean;
  requiresLegionellaRiskAssessment: boolean;
  requiresGasSafetyCertificate: boolean;
  requiresPATTesting: boolean;
  requiresEICRCertificate: boolean;
}

export interface HotelFacilityData {
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  county: string;
  postCode: string;
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
  fireHoseReels: 0,
  emergencyLighting: 0,
  exitSigns: 0,
  fireDoorsCount: 0,
  fireBlankets: 0,
  co2Extinguishers: 0,
  foamExtinguishers: 0,
  emergencyStairs: 0
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
  greaseTrapSize: '',
  waterTankCapacity: '',
  backupGeneratorCapacity: '',
  thermostaticMixingValves: 0,
  numberOfGreaseTraps: 0,
  greaseRemovalSupplier: '',
  fogAuditRequired: false
};

export const defaultStructural: StructuralInfo = {
  floors: 1,
  basements: 0,
  totalRooms: 0,
  suites: 0,
  yearBuilt: new Date().getFullYear(),
  constructionYear: new Date().getFullYear(),
  totalSquareMetres: 0,
  buildingHeightMetres: 0,
  buildingType: ''
};

export const defaultCompliance: ComplianceRequirements = {
  requiresAnsulService: false,
  requiresElevatorInspection: false,
  requiresBoilerInspection: false,
  requiresFireSystemInspection: false,
  requiresPoolInspection: false,
  requiresKitchenHoodCleaning: false,
  requiresBackflowTesting: false,
  requiresGreaseTrapService: false,
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
    county: '',
    postCode: '',
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
