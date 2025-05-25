'use client';

import { User2, Menu } from 'lucide-react';

interface HeaderBarProps {
  onHotelSelectClick?: () => void;
  currentHotelName: string;
  onUserIconClick?: () => void;
  onMenuToggle?: () => void;
}

export default function HeaderBar({
  onHotelSelectClick,
  currentHotelName,
  onUserIconClick,
  onMenuToggle
}: HeaderBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 h-16 z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          
          {/* Left - Hamburger Menu (mobile only) */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={onMenuToggle}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Center - Hotel Selector */}
          <div className="flex-1 flex justify-center">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium shadow-sm"
              onClick={onHotelSelectClick}
            >
              <span className="text-sm sm:text-base">{currentHotelName}</span>
              <span className="text-blue-200">▼</span>
            </button>
          </div>

          {/* Right - User Icon */}
          <div className="flex items-center">
            <button
              onClick={onUserIconClick}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Account"
            >
              <User2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
