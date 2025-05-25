'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User2, Building, Menu } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import MessagesDropdown from './MessagesDropdown';

interface AdminHeaderProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onOpenHotelSelector: () => void;
  onOpenUserPanel: () => void;
  onOpenAccountSettings: () => void;
  isMobile: boolean;
}

export default function AdminHeader({ 
  showSidebar, 
  onToggleSidebar, 
  onOpenHotelSelector, 
  onOpenUserPanel,
  onOpenAccountSettings,
  isMobile 
}: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadNotifications] = useState(3);
  const [unreadMessages] = useState(2);

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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left - Hamburger Menu + Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Hamburger */}
            {!showSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex items-center">
              <Image src="/jmk-logo.png" alt="JMK Hotels" width={140} height={35} className="object-contain" />
            </div>
          </div>
          
          {/* Right - Admin Tools & Navigation */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications */}
            <NotificationsDropdown 
              isOpen={showNotifications}
              onToggle={() => setShowNotifications(!showNotifications)}
              unreadCount={unreadNotifications}
            />

            {/* Messages */}
            <MessagesDropdown 
              isOpen={showMessages}
              onToggle={() => setShowMessages(!showMessages)}
              unreadCount={unreadMessages}
            />

            {/* Hotel Selector */}
            <button 
              onClick={onOpenHotelSelector}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Building className="w-4 h-4" />
              <span>Admin Dashboard</span>
              <span>⌄</span>
            </button>
            
            {/* User Account */}
            <button 
              onClick={onOpenUserPanel} 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Account"
            >
              <User2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
