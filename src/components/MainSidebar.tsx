'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
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
    // Auto-close on mobile when nav item is clicked
    if (isMobile && onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-slate-800 text-white z-50 transition-transform duration-300 ease-in-out
        ${isMobile 
          ? `w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto` 
          : 'w-64 static'
        }
      `}>
        
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="flex justify-end p-4 lg:hidden">
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* JMK Logo */}
        <div className="p-6 border-b border-slate-700 flex justify-center">
          <Link href="https://jmkfacilities.ie/hotels" onClick={handleClick}>
            <img
              src="/jmk-logo.png"
              alt="JMK Logo"
              className="cursor-pointer h-8 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <Link 
            href={`/hotels/${hotelId}/building`} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
            onClick={handleClick}
          >
            <Building2 className="w-5 h-5 mr-3" />
            <span>Building</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/compliance`} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
            onClick={handleClick}
          >
            <ShieldCheck className="w-5 h-5 mr-3" />
            <span>Compliance</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/utilities`} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
            onClick={handleClick}
          >
            <PlugZap className="w-5 h-5 mr-3" />
            <span>Utilities</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/tenders`} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
            onClick={handleClick}
          >
            <FileText className="w-5 h-5 mr-3" />
            <span>Tenders</span>
          </Link>

          <Link 
            href={`/hotels/${hotelId}/service-reports`} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
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
