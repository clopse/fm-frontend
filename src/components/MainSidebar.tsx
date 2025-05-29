'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  PlugZap,
  FileText,
  ClipboardList,
  X,
  Menu,
  Home
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
  const pathname = usePathname();

  const handleClick = () => {
    if (onItemClick) onItemClick();
  };

  const handleLogoClick = () => {
    if (isMobile && onClose) onClose();
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: `/hotels/${hotelId}`,
      icon: Home,
      description: 'Hotel overview'
    },
    {
      label: 'Building Management',
      href: `/hotels/${hotelId}/building`,
      icon: Building2,
      description: 'Property and infrastructure'
    },
    {
      label: 'Compliance',
      href: `/hotels/${hotelId}/compliance`,
      icon: ShieldCheck,
      description: 'Safety and regulatory compliance'
    },
    {
      label: 'Utilities',
      href: `/hotels/${hotelId}/utilities`,
      icon: PlugZap,
      description: 'Energy and utility management'
    },
    {
      label: 'Tenders',
      href: `/hotels/${hotelId}/tenders`,
      icon: FileText,
      description: 'Procurement and contracts'
    },
    {
      label: 'Service Reports',
      href: `/hotels/${hotelId}/service-reports`,
      icon: ClipboardList,
      description: 'Maintenance and service logs'
    }
  ];

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
        fixed top-0 left-0 h-full bg-slate-800 text-white z-50 transition-transform duration-300 ease-in-out w-72
        ${isMobile 
          ? `${isOpen ? 'translate-x-0' : '-translate-x-full'}` 
          : `${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        }
      `}>
        
        {/* Header with Logo and Toggle Button */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {/* JMK Logo */}
            <Link href="https://jmkfacilities.ie/hotels" onClick={handleLogoClick}>
              <img
                src="/jmk-logo.png"
                alt="JMK Logo"
                className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
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
        <nav className="mt-6 px-4 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`
                  flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200 group
                  ${active 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
                onClick={handleClick}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-xs text-gray-400">JMK Facilities Management</div>
            <div className="text-xs text-gray-500 mt-1">Hotel Portal v2.0</div>
          </div>
        </div>
      </div>
    </>
  );
}
