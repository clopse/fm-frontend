'use client';

import { useState, useEffect } from 'react';
import { User2, Building, Menu } from 'lucide-react';
import { userService } from '@/services/userService';

interface HeaderBarProps {
  onHotelSelectClick?: () => void;
  currentHotelName: string;
  onUserIconClick?: () => void;
  onMenuToggle?: () => void;
  showHamburger?: boolean;
}

export default function HeaderBar({
  onHotelSelectClick,
  currentHotelName,
  onUserIconClick,
  onMenuToggle,
  showHamburger = false
}: HeaderBarProps) {
  const [canSwitchHotels, setCanSwitchHotels] = useState(true);

  // Check user's hotel access permissions
  useEffect(() => {
    try {
      const user = userService.getCurrentUser();
      
      if (user && user.hotel) {
        // User can switch hotels if:
        // 1. They have "All Hotels" access, OR
        // 2. They have multiple hotels (comma-separated or array)
        const hasAllHotelsAccess = user.hotel === 'All Hotels';
        const hasMultipleHotels = user.hotel.includes(','); // If comma-separated list
        
        setCanSwitchHotels(hasAllHotelsAccess || hasMultipleHotels);
      }
    } catch (error) {
      console.error('Error checking hotel permissions:', error);
      // Default to allowing hotel switch if we can't determine
      setCanSwitchHotels(true);
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface border-b border-border-soft h-16 z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">

          {/* Left - Hamburger Menu */}
          <div className="flex items-center">
            {showHamburger && (
              <button
                onClick={onMenuToggle}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors"
                title="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Center - Hotel Selector / Display */}
          <div className="flex-1 flex justify-center">
            {canSwitchHotels ? (
              // Clickable hotel selector for users with multi-hotel access
              <button
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
                onClick={onHotelSelectClick}
              >
                <Building className="w-4 h-4" />
                <span className="text-sm sm:text-base">{currentHotelName}</span>
                <span className="text-white/70">⌄</span>
              </button>
            ) : (
              // Non-clickable hotel display for single-hotel users
              <div className="bg-accent text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium cursor-default">
                <Building className="w-4 h-4" />
                <span className="text-sm sm:text-base">{currentHotelName}</span>
              </div>
            )}
          </div>

          {/* Right - User Account */}
          <div className="flex items-center space-x-2">

            {/* User Account */}
            <button
              onClick={onUserIconClick}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors"
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
