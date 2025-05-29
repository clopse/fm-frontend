// FILE: src/components/hotels/HotelTabNavigation.tsx
'use client';

import { Building, Flame, Wrench, Zap, Shield } from 'lucide-react';

interface HotelTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Building },
  { id: 'structural', label: 'Building Info', icon: Building },
  { id: 'fire', label: 'Fire Safety', icon: Flame },
  { id: 'mechanical', label: 'Mechanical', icon: Wrench },
  { id: 'utilities', label: 'Utilities', icon: Zap },
  { id: 'compliance', label: 'Compliance', icon: Shield }
];

export default function HotelTabNavigation({ activeTab, onTabChange }: HotelTabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
