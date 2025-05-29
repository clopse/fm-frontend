'use client';

import { useState, useEffect } from 'react';
import { User2, Building, Menu } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import MessagesDropdown from './MessagesDropdown';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showNotifications && !target.closest('[data-dropdown="notifications"]')) {
        setShowNotifications(false);
      }
      
      if (showMessages && !target.closest('[data-dropdown="messages"]')) {
        setShowMessages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showMessages]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 h-16 z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          
          {/* Left - Hamburger Menu */}
          <div className="flex items-center">
            {showHamburger && (
              <button
                onClick={onMenuToggle}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Center - Hotel Selector */}
          <div className="flex-1 flex justify-center">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium shadow-sm"
              onClick={onHotelSelectClick}
            >
              <Building className="w-4 h-4" />
              <span className="text-sm sm:text-base">{currentHotelName}</span>
              <span className="text-blue-200">⌄</span>
            </button>
          </div>

          {/* Right - Notifications, Messages, User */}
          <div className="flex items-center space-x-2">
            
            {/* Notifications */}
            <NotificationsDropdown 
              isOpen={showNotifications}
              onToggle={() => setShowNotifications(!showNotifications)}
            />

            {/* Messages */}
            <MessagesDropdown 
              isOpen={showMessages}
              onToggle={() => setShowMessages(!showMessages)}
            />

            {/* User Account */}
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
