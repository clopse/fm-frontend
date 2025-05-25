'use client';

import { useRouter } from 'next/navigation';
import { User2, ArrowLeft, Menu } from 'lucide-react';

interface HeaderBarProps {
  onHotelSelectClick?: () => void;
  currentHotelName: string;
  onUserIconClick?: () => void;
  showBackButton?: boolean;
  backButtonLabel?: string;
  customBackUrl?: string;
  onMenuToggle?: () => void;
}

export default function HeaderBar({
  onHotelSelectClick,
  currentHotelName,
  onUserIconClick,
  showBackButton = true,
  backButtonLabel = "Back to Dashboard",
  customBackUrl,
  onMenuToggle
}: HeaderBarProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (customBackUrl) {
      router.push(customBackUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 relative z-30">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          
          {/* Far Left - Hamburger Menu + Back Button */}
          <div className="flex items-center space-x-2">
            {/* Hamburger Menu - Only visible on mobile */}
            <button
              onClick={onMenuToggle}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Back Button - Just arrow, no text */}
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={backButtonLabel}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
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

          {/* Far Right - User Icon */}
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
