import rawData from './compliance.json';

export interface SubTask {
  label: string;
  points: number;
}

export type ComplianceType = 'upload' | 'confirmation';

export interface ComplianceTask {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  type: ComplianceType; // Strict
  needs_report: 'yes' | 'no';
  mandatory: boolean;
  points: number;
  info_popup: string;
  subtasks?: SubTask[];
}

export interface ComplianceSection {
  section: string;
  tasks: ComplianceTask[];
}

// 💥 Cast JSON safely
export const complianceGroups: ComplianceSection[] = rawData as ComplianceSection[];
