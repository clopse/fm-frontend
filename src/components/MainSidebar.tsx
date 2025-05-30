'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  PlugZap,
  FileText,
  ClipboardList,
  X,
  Menu,
  Home,
  ChevronDown,
  ChevronRight,
  Zap,
  Flame,
  Droplets,
  BarChart3,
  Upload,
  TrendingUp
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['utilities']);

  const handleClick = () => {
    if (onItemClick) onItemClick();
  };

  const handleLogoClick = () => {
    if (isMobile && onClose) onClose();
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path: string) => {
    // For dashboard, only match exact path
    if (path.endsWith(`/hotels/${hotelId}`)) {
      return pathname === path;
    }
    // For other pages, check if pathname starts with the path
    return pathname.startsWith(path) && pathname !== `/hotels/${hotelId}`;
  };

  const isUtilitiesActive = () => {
    return pathname.startsWith(`/hotels/${hotelId}/utilities`);
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
      id: 'utilities',
      label: 'Utilities',
      href: `/hotels/${hotelId}/utilities`,
      icon: PlugZap,
      description: 'Energy and utility management',
      hasSubItems: true,
      subItems: [
        {
          label: 'Overview',
          href: `/hotels/${hotelId}/utilities`,
          icon: BarChart3,
          description: 'Dashboard with KPIs and charts'
        },
        {
          label: 'Electricity',
          href: `/hotels/${hotelId}/utilities/electricity`,
          icon: Zap,
          description: 'Detailed electricity analysis'
        },
        {
          label: 'Gas',
          href: `/hotels/${hotelId}/utilities/gas`,
          icon: Flame,
          description: 'Gas consumption tracking'
        },
        {
          label: 'Water',
          href: `/hotels/${hotelId}/utilities/water`,
          icon: Droplets,
          description: 'Water usage monitoring'
        },
        {
          label: 'Bills Archive',
          href: `/hotels/${hotelId}/utilities/bills`,
          icon: FileText,
          description: 'All uploaded utility bills'
        },
        {
          label: 'Analytics',
          href: `/hotels/${hotelId}/utilities/analytics`,
          icon: TrendingUp,
          description: 'Advanced metrics & insights'
        },
        {
          label: 'Upload Bills',
          href: `/hotels/${hotelId}/utilities/upload`,
          icon: Upload,
          description: 'Upload new utility bills'
        }
      ]
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
            const isExpanded = item.hasSubItems && expandedSections.includes(item.id || '');
            const hasSubItems = item.hasSubItems && item.subItems;
            
            return (
              <div key={item.href} className="mb-2">
                {/* Main Item */}
                <div className="flex items-center">
                  <Link 
                    href={item.href} 
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-all duration-200 group flex-1
                      ${active || (item.id === 'utilities' && isUtilitiesActive())
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }
                    `}
                    onClick={handleClick}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${
                      active || (item.id === 'utilities' && isUtilitiesActive())
                        ? 'text-white' 
                        : 'text-gray-400 group-hover:text-white'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs mt-0.5 ${
                        active || (item.id === 'utilities' && isUtilitiesActive())
                          ? 'text-blue-100' 
                          : 'text-gray-500 group-hover:text-gray-300'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                  
                  {/* Expand/Collapse Button for sections with sub-items */}
                  {hasSubItems && (
                    <button
                      onClick={() => toggleSection(item.id || '')}
                      className={`p-2 mr-2 rounded transition-colors ${
                        active || (item.id === 'utilities' && isUtilitiesActive())
                          ? 'text-white hover:bg-blue-700' 
                          : 'text-gray-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isExpanded ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>

                {/* Sub Items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = isActive(subItem.href);
                      
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`
                            flex items-center px-3 py-2 rounded-md transition-all duration-200 group text-sm
                            ${subActive
                              ? 'bg-blue-500 text-white shadow-md' 
                              : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                            }
                          `}
                          onClick={handleClick}
                        >
                          <SubIcon className={`w-4 h-4 mr-3 ${
                            subActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium">{subItem.label}</div>
                            <div className={`text-xs mt-0.5 ${
                              subActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-400'
                            }`}>
                              {subItem.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
