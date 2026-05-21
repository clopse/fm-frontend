import { useState } from "react";
import { Building2, Info } from "lucide-react";

interface HotelConfig {
  hotelName: string;
  hotelCode: string;
  totalFloors: number;
  hasBasement: boolean;
  hasGroundFloor: boolean;
  openingDate: string;
  propertyType: "hotel" | "aparthotel" | "serviced_apartments";
}

interface WizardStep1Props {
  config: HotelConfig;
  onUpdate: (config: HotelConfig) => void;
  onNext: () => void;
}

export default function WizardStep1HotelConfig({ config, onUpdate, onNext }: WizardStep1Props) {
  const handleChange = (field: keyof HotelConfig, value: any) => {
    onUpdate({ ...config, [field]: value });
  };

  const canProceed = config.hotelName && config.hotelCode && config.totalFloors > 0;

  const totalGuestFloors = config.totalFloors + 
    (config.hasBasement ? 1 : 0) + 
    (config.hasGroundFloor ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Hotel Configuration</p>
            <p>Let's start with basic hotel information. This sets up the foundation for your asset register and helps with asset coding conventions.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hotel Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hotel Name *
          </label>
          <input
            type="text"
            value={config.hotelName}
            onChange={(e) => handleChange("hotelName", e.target.value)}
            placeholder="e.g., Holiday Inn Express Dublin Airport"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        {/* Hotel Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hotel Code *
          </label>
          <input
            type="text"
            value={config.hotelCode}
            onChange={(e) => handleChange("hotelCode", e.target.value.toUpperCase())}
            placeholder="e.g., HIE-DUB"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent uppercase"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">Used for asset coding (e.g., HIE-DUB-RM101-TV)</p>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <select
            value={config.propertyType}
            onChange={(e) => handleChange("propertyType", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="hotel">Standard Hotel</option>
            <option value="aparthotel">Aparthotel (with kitchens)</option>
            <option value="serviced_apartments">Serviced Apartments</option>
          </select>
        </div>

        {/* Opening Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opening Date / Installation Date
          </label>
          <input
            type="date"
            value={config.openingDate}
            onChange={(e) => handleChange("openingDate", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Default installation date for new assets</p>
        </div>
      </div>

      {/* Floor Configuration */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-blue-600" />
          Building Structure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Floors *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.totalFloors}
              onChange={(e) => handleChange("totalFloors", parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Number of numbered floors (1, 2, 3...)</p>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.hasGroundFloor}
                onChange={(e) => handleChange("hasGroundFloor", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-accent"
              />
              <span className="ml-2 text-sm text-gray-700">Ground Floor (0)</span>
            </label>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.hasBasement}
                onChange={(e) => handleChange("hasBasement", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-accent"
              />
              <span className="ml-2 text-sm text-gray-700">Basement (B)</span>
            </label>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-medium">Floor structure:</span>
            {config.hasBasement && <span className="ml-2 text-gray-600">B (Basement)</span>}
            {config.hasGroundFloor && (
              <span className="ml-2 text-gray-600">
                {config.hasBasement ? '→' : ''} 0 (Ground)
              </span>
            )}
            <span className="ml-2 text-gray-600">
              {(config.hasBasement || config.hasGroundFloor) ? '→' : ''} 1 to {config.totalFloors}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            Total floors: <span className="font-medium text-gray-700">{totalGuestFloors}</span>
            {(config.hasBasement || config.hasGroundFloor) && (
              <span className="ml-2 text-amber-600">
                (You can mark floors as "no guest rooms" in the next step)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next: Configure Floors
        </button>
      </div>
    </div>
  );
}
