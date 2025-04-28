// NOTE: Task rules (frequency, scoring, uploads_required) are managed in:
// backend/app/data/taskRules.json
// 👉 Make sure to update both files when adding/removing tasks

export interface Task {
  id: string;
  label: string;
  frequency: string;
}

export type SafetyGroups = Record<string, Task[]>;

export const safetyGroups: SafetyGroups = {
  "Fire Safety": [
    { id: "fire_extinguisher", label: "Fire extinguisher report", frequency: "annual" },
    { id: "sprinkler_check", label: "Sprinkler system report", frequency: "annual" },
    { id: "fire_alarm", label: "Fire alarm test (day & night)", frequency: "6-per-year" },
    { id: "fire_walks", label: "Fire walks (weekly)", frequency: "weekly_percentage" },
    { id: "panel_check", label: "Fire panel check", frequency: "quarterly" },
    { id: "aov_check", label: "AOV check", frequency: "annual" },
    { id: "dry_riser", label: "Dry riser report", frequency: "annual" },
    { id: "disabled_refuge", label: "Disabled refuge point check", frequency: "annual" },
    { id: "fire_door_inspection", label: "Fire door inspection records", frequency: "annual" },
    { id: "fire_damper", label: "Fire damper records and remedials", frequency: "annual" },
    { id: "fire_box", label: "Fire box stocked correctly", frequency: "monthly" },
    { id: "fire_training_check", label: "Induction & Click HSE Fire Training", frequency: "annual" },
    { id: "unplanned_fire_evacs", label: "Unplanned Fire evacuation records", frequency: "review" },
    { id: "planned_fire_evacs", label: "Planned Fire evacuation records", frequency: "biannual" }
  ],
  "Electrical": [
    { id: "emergency_lighting", label: "Emergency lighting test", frequency: "monthly" },
    { id: "electrical_certificate", label: "Electrical installation report", frequency: "5-year" },
    { id: "pat_testing", label: "PAT testing", frequency: "annual" },
    { id: "fire_curtain", label: "Fire Curtain Service", frequency: "annual" },
    { id: "lightning_conductor", label: "Lightning conductor service", frequency: "annual" },
    { id: "fall_arrest", label: "Fall arrest service", frequency: "annual" },
    { id: "fire_panel_service", label: "Fire panel and detector service", frequency: "quarterly" },
    { id: "downtime_report", label: "Hotel downtime logs (printed every 2h)", frequency: "daily" },
    { id: "fixed_wiring", label: "Fixed wiring test and sign-off", frequency: "5-year" }
  ],
  "Legionella": [
    { id: "legionella_risk", label: "Legionella Risk Assessment", frequency: "2-year" },
    { id: "quarterly_disinfection", label: "Quarterly disinfections", frequency: "quarterly" },
    { id: "shower_descale", label: "Shower head descaling & sanitising", frequency: "quarterly" },
    { id: "scheme_of_control", label: "Temperature logs and Scheme of Control", frequency: "monthly" }
  ],
  "HR & Training": [
    { id: "fire_training", label: "Fire training certs", frequency: "annual" },
    { id: "first_aid", label: "First aid certs", frequency: "annual" },
    { id: "fire_warden", label: "Fire warden certs", frequency: "annual" },
    { id: "safepass", label: "Safe pass / general certs", frequency: "annual" },
    { id: "click_hse", label: "Mandatory Click HSE training", frequency: "annual" },
    { id: "team_fire_cards", label: "Team members understand Fire cards", frequency: "observation" },
    { id: "first_aiders_on_shift", label: "Trained 1st aiders on shift", frequency: "always" }
  ],
  "Policies & Docs": [
    { id: "crisis_manual", label: "Hotel Crisis Manual", frequency: "annual" },
    { id: "hse_policy", label: "H&S policy displayed", frequency: "annual" },
    { id: "risk_assessments", label: "Hotel Risk Assessments signed by GM", frequency: "annual" },
    { id: "contractor_logs", label: "Contractor/visitor log book", frequency: "always" },
    { id: "contractor_insurance", label: "Contractor PL insurance certs", frequency: "annual" },
    { id: "accident_book", label: "Accident book and first aid kit check", frequency: "monthly" },
    { id: "incident_reviews", label: "Incident review process", frequency: "ongoing" },
    { id: "ladder_register", label: "Ladder register and monthly checks", frequency: "monthly" },
    { id: "coshh", label: "COSHH sheets / PPE / training in place", frequency: "always" }
  ],
  "Kitchen": [
    { id: "kitchen_extract", label: "Kitchen extract clean", frequency: "6-month" },
    { id: "ansul_service", label: "Ansul system service", frequency: "6-month" },
    { id: "gas_appliances", label: "Gas appliances tested", frequency: "annual" },
    { id: "gas_detection", label: "Gas detection system records", frequency: "annual" }
  ]
};
