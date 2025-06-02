// FILE: src/components/hotels/HotelFireSafetyTab.tsx
'use client';

import { FireSafetyEquipment } from '@/types/hotelTypes';
import { Shield, Flame, Droplets, Zap, DoorOpen } from 'lucide-react';

interface HotelFireSafetyTabProps {
  fireSafety: FireSafetyEquipment;
  isEditing: boolean;
  onUpdate: (key: string, value: number) => void;
}

export default function HotelFireSafetyTab({ fireSafety, isEditing, onUpdate }: HotelFireSafetyTabProps) {
  const fieldLabels: Record<string, string> = {
    fireExtinguishers: 'Fire Extinguishers',
    smokeDetectors: 'Smoke Detectors', 
    fireAlarmPanels: 'Fire Alarm Panels',
    sprinklerHeads: 'Sprinkler Heads',
    dryRisers: 'Dry Risers',
    wetRisers: 'Wet Risers',
    fireHoseReels: 'Fire Hose Reels',
    emergencyLighting: 'Emergency Lighting Units',
    exitSigns: 'Exit Signs',
    fireDoorsCount: 'Fire Doors',
    fireBlankets: 'Fire Blankets',
    co2Extinguishers: 'CO₂ Extinguishers',
    foamExtinguishers: 'Foam Extinguishers',
    emergencyStairs: 'Emergency Stairs'
  };

  const fieldDescriptions: Record<string, string> = {
    fireExtinguishers: 'Total number of portable fire extinguishers throughout the property',
    smokeDetectors: 'Number of smoke detection devices installed',
    fireAlarmPanels: 'Central fire alarm control panels',
    sprinklerHeads: 'Total sprinkler heads in the automatic sprinkler system',
    dryRisers: 'Dry riser outlets for fire brigade use',
    wetRisers: 'Wet riser systems with permanent water supply',
    fireHoseReels: 'Fixed fire hose reel installations',
    emergencyLighting: 'Emergency lighting units for evacuation routes',
    exitSigns: 'Illuminated emergency exit signs',
    fireDoorsCount: 'Fire-rated doors throughout the building',
    fireBlankets: 'Fire suppression blankets (typically in kitchens)',
    co2Extinguishers: 'Carbon dioxide fire extinguishers for electrical fires',
    foamExtinguishers: 'Foam fire extinguishers for liquid fires',
    emergencyStairs: 'Dedicated emergency escape stairwells'
  };

  // Group fields for better organization with icons and colors
  const fieldGroups = [
    {
      title: 'Detection & Alarm Systems',
      fields: ['smokeDetectors', 'fireAlarmPanels'],
      icon: Shield,
      color: isEditing ? 'bg-blue-50' : 'bg-gray-50'
    },
    {
      title: 'Suppression Equipment',
      fields: ['fireExtinguishers', 'co2Extinguishers', 'foamExtinguishers', 'fireBlankets', 'sprinklerHeads'],
      icon: Flame,
      color: isEditing ? 'bg-red-50' : 'bg-gray-50'
    },
    {
      title: 'Water Systems',
      fields: ['dryRisers', 'wetRisers', 'fireHoseReels'],
      icon: Droplets,
      color: isEditing ? 'bg-cyan-50' : 'bg-gray-50'
    },
    {
      title: 'Emergency Systems',
      fields: ['emergencyLighting', 'exitSigns'],
      icon: Zap,
      color: isEditing ? 'bg-yellow-50' : 'bg-gray-50'
    },
    {
      title: 'Building Features',
      fields: ['fireDoorsCount', 'emergencyStairs'],
      icon: DoorOpen,
      color: isEditing ? 'bg-green-50' : 'bg-gray-50'
    }
  ];

  const handleInputChange = (key: string, value: string) => {
    // Convert to number, handle empty string as 0
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(key, numValue);
    }
  };

  const renderField = (key: string) => (
    <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
      isEditing 
        ? 'bg-white border-blue-200 shadow-sm' 
        : 'bg-gray-50 border-gray-2
