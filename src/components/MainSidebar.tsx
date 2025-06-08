'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
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
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Memoize navigation items to prevent recreation on every render
  const navItems = useMemo(() => [
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
  ], [hotelId]); // Only recreate when hotelId changes

  // Memoize active state calculations
  const activeStates = useMemo(() => {
    const isActive = (path: string) => pathname === path;
    const isUtilitiesParentActive = () => 
      pathname.startsWith(`/hotels/${hotelId}/utilities`) && pathname !== `/hotels/${hotelId}/utilities`;
    
    return {
      isActive,
      isUtilitiesParentActive: isUtilitiesParentActive()
    };
  }, [pathname, hotelId]);

  // Memoize event handlers
  const handleClick = useCallback(() => {
    if (onItemClick) onItemClick();
  }, [onItemClick]);

  const handleUtilitiesClick = useCallback(() => {
    // Auto-expand utilities when clicking the main utilities link
    if (!expandedSections.includes('utilities')) {
      setExpandedSections(prev => [...prev, 'utilities']);
    }
    handleClick();
  }, [expandedSections, handleClick]);

  const handleLogoClick = useCallback(() => {
    if (isMobile && onClose) onClose();
  }, [isMobile, onClose]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  // Memoize CSS classes to prevent recreation
  const sidebarClasses = useMemo(() => `
    fixed top-0 left-0 h-full bg-slate-800 text-white z-50 transition-transform duration-300 ease-in-out w-72
    ${isMobile 
      ? `${isOpen ? 'translate-x-0' : '-translate-x-full'}` 
      : `${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    }
  `, [isMobile, isOpen]);

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
      <div className={sidebarClasses}>
        
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
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              activeStates={activeStates}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onUtilitiesClick={handleUtilitiesClick}
              onClick={handleClick}
            />
          ))}
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

// Extract NavItem into separate component for better performance
interface NavItemProps {
  item: any;
  activeStates: {
    isActive: (path: string) => boolean;
    isUtilitiesParentActive: boolean;
  };
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onUtilitiesClick: () => void;
  onClick: () => void;
}

const NavItem = ({ 
  item, 
  activeStates, 
  expandedSections, 
  onToggleSection, 
  onUtilitiesClick, 
  onClick 
}: NavItemProps) => {
  const Icon = item.icon;
  const active = activeStates.isActive(item.href);
  const isExpanded = item.hasSubItems && expandedSections.includes(item.id || '');
  const hasSubItems = item.hasSubItems && item.subItems;
  
  // For utilities parent, show as active only when on exact utilities page OR when a child is active
  const isUtilitiesMainActive = item.id === 'utilities' && (active || activeStates.isUtilitiesParentActive);

  // Memoize click handlers
  const handleMainClick = useCallback(() => {
    if (item.id === 'utilities') {
      onUtilitiesClick();
    } else {
      onClick();
    }
  }, [item.id, onUtilitiesClick, onClick]);

  const handleToggleClick = useCallback(() => {
    onToggleSection(item.id || '');
  }, [item.id, onToggleSection]);

  // Memoize CSS classes
  const mainItemClasses = useMemo(() => `
    flex items-center px-4 py-3 rounded-lg transition-all duration-200 group flex-1
    ${active || isUtilitiesMainActive
      ? 'bg-blue-600 text-white shadow-lg' 
      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
    }
  `, [active, isUtilitiesMainActive]);

  const iconClasses = useMemo(() => `w-5 h-5 mr-3 ${
    active || isUtilitiesMainActive
      ? 'text-white' 
      : 'text-gray-400 group-hover:text-white'
  }`, [active, isUtilitiesMainActive]);

  const descriptionClasses = useMemo(() => `text-xs mt-0.5 ${
    active || isUtilitiesMainActive
      ? 'text-blue-100' 
      : 'text-gray-500 group-hover:text-gray-300'
  }`, [active, isUtilitiesMainActive]);

  return (
    <div className="mb-2">
      {/* Main Item */}
      <div className="flex items-center">
        <Link 
          href={item.href} 
          className={mainItemClasses}
          onClick={handleMainClick}
        >
          <Icon className={iconClasses} />
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            <div className={descriptionClasses}>
              {item.description}
            </div>
          </div>
        </Link>
        
        {/* Expand/Collapse Button for sections with sub-items */}
        {hasSubItems && (
          <button
            onClick={handleToggleClick}
            className={`p-2 mr-2 rounded transition-colors ${
              active || isUtilitiesMainActive
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
          {item.subItems?.map((subItem: any) => (
            <SubNavItem
              key={subItem.href}
              subItem={subItem}
              isActive={activeStates.isActive(subItem.href)}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Extract SubNavItem for even better performance
interface SubNavItemProps {
  subItem: any;
  isActive: boolean;
  onClick: () => void;
}

const SubNavItem = ({ subItem, isActive, onClick }: SubNavItemProps) => {
  const SubIcon = subItem.icon;

  const subItemClasses = useMemo(() => `
    flex items-center px-3 py-2 rounded-md transition-all duration-200 group text-sm
    ${isActive
      ? 'bg-blue-500 text-white shadow-md' 
      : 'text-gray-400 hover:bg-slate-700 hover:text-white'
    }
  `, [isActive]);

  const subIconClasses = useMemo(() => `w-4 h-4 mr-3 ${
    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
  }`, [isActive]);

  const subDescriptionClasses = useMemo(() => `text-xs mt-0.5 ${
    isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-400'
  }`, [isActive]);

  return (
    <Link
      href={subItem.href}
      className={subItemClasses}
      onClick={onClick}
    >
      <SubIcon className={subIconClasses} />
      <div className="flex-1">
        <div className="font-medium">{subItem.label}</div>
        <div className={subDescriptionClasses}>
          {subItem.description}
        </div>
      </div>
    </Link>
  );
};
