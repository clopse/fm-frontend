'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  PlugZap,
  FileText,
  ClipboardList,
  X
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
        
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="flex justify-end p-4 lg:hidden">
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* JMK Logo/Home Button */}
        <div className="p-6 border-b border-slate-700 flex justify-center">
          <Link href="https://jmkfacilities.ie/hotels" onClick={handleLogoClick}>
            <div className="text-white font-bold text-lg cursor-pointer hover:text-gray-200 transition-colors text-center">
              JMK GROUP
              <div className="text-xs font-normal text-gray-300 mt-1">Facilities</div>
            </div>
          </Link>
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
