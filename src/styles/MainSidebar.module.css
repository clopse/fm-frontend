'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  PlugZap,
  FileText,
  ClipboardList,
  X,
  Menu
} from 'lucide-react';

interface MainSidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function MainSidebar({ 
  isMobile = false, 
  onItemClick,
  isOpen = true,
  onClose 
}: MainSidebarProps) {
  const { hotelId } = useParams();

  const handleClick = () => {
    if (onItemClick) onItemClick();
  };

  const handleLogoClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-slate-800 text-white z-50 transition-transform duration-300 ease-in-out w-64
        ${isMobile 
          ? `${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto` 
          : 'static'
        }
      `}>
        
        {/* Header with Logo and Toggle Button */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {/* JMK Logo */}
            <Link href="https://jmkfacilities.ie/hotels" onClick={handleLogoClick}>
              <img
                src="/jmk-logo.png"
                alt="JMK Logo"
                className="h-8 w-auto cursor-pointer filter brightness-0 invert hover:opacity-80 transition-opacity"
              />
            </Link>
            
            {/* Hide/Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={isMobile ? "Close Menu" : "Hide Sidebar"}
            >
              {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 px-4">
          <Link 
            href={`/hotels/${hotelId}/building`} 
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg mb-2"
            onClick={handleClick}
          >
            <Building2 className="w-5 h-5 mr-3" />
            <span>Building</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/compliance`} 
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg mb-2"
            onClick={handleClick}
          >
            <ShieldCheck className="w-5 h-5 mr-3" />
            <span>Compliance</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/utilities`} 
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg mb-2"
            onClick={handleClick}
          >
            <PlugZap className="w-5 h-5 mr-3" />
            <span>Utilities</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/tenders`} 
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg mb-2"
            onClick={handleClick}
          >
            <FileText className="w-5 h-5 mr-3" />
            <span>Tenders</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/service-reports`} 
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg mb-2"
            onClick={handleClick}
          >
            <ClipboardList className="w-5 h-5 mr-3" />
            <span>Service Reports</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
