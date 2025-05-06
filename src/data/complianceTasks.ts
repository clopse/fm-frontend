import data from './compliance.json';

export interface SubTask {
  label: string;
  points: number;
}

export interface ComplianceTask {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  type: 'upload' | 'confirmation';
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

// Final export
export const complianceGroups: ComplianceSection[] = data;
