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
  FolderOpen,
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
import { userService } from '@/services/userService';
import { isAdmin } from '@/lib/auth';

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

  const currentUser = userService.getCurrentUser();

  const navItems = useMemo(() => [
    {
      label: 'Dashboard',
      href: `/hotels/${hotelId}`,
      icon: Home,
      description: 'Hotel overview'
    },
    {
      label: 'Drawings',
      href: `/hotels/${hotelId}/building`,
      icon: Building2,
      description: 'Property and infrastructure'
    },
    {
      id: 'compliance',
      label: 'Compliance',
      href: `/hotels/${hotelId}/compliance`,
      icon: ShieldCheck,
      description: 'Safety and regulatory compliance',
      alwaysShowSubItems: true,
      subItems: [
        {
          label: 'Compliance Reports',
          href: `/hotels/${hotelId}/service-reports`,
          icon: FolderOpen,
          description: 'Uploaded certificates & documents',
        },
      ],
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
      ]
    },
    {
      label: 'Assets',
      href: `/hotels/${hotelId}/assets`,
      icon: FileText,
      description: 'Asset Register'
    },
  ], [hotelId]);

  const activeStates = useMemo(() => {
    const isActive = (path: string) => pathname === path;
    const isUtilitiesParentActive = () => 
      pathname.startsWith(`/hotels/${hotelId}/utilities`) && pathname !== `/hotels/${hotelId}/utilities`;
    
    return {
      isActive,
      isUtilitiesParentActive: isUtilitiesParentActive()
    };
  }, [pathname, hotelId]);

  const handleClick = useCallback(() => {
    if (onItemClick) onItemClick();
  }, [onItemClick]);

  const handleUtilitiesClick = useCallback(() => {
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

  const sidebarClasses = useMemo(() => `
    fixed top-0 left-0 h-screen w-72 bg-slate-800 text-white z-50
    flex flex-col transition-transform duration-300 ease-in-out
    ${isMobile
      ? `${isOpen ? 'translate-x-0' : '-translate-x-full'}`
      : `${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    }
  `, [isMobile, isOpen]);

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={sidebarClasses}>
        <div className="p-4 xl:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link href="https://jmkfacilities.ie/hotels" onClick={handleLogoClick}>
              <img
                src="/jmk-logo.png"
                alt="JMK Logo"
                className="h-8 xl:h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={isMobile ? "Close Menu" : "Hide Sidebar"}
            >
              {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="mt-3 xl:mt-6 px-3 xl:px-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              activeStates={activeStates}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onUtilitiesClick={handleUtilitiesClick}
              onClick={handleClick}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="p-3 xl:p-4 border-t border-slate-700 flex-shrink-0">
          <div className="text-center">
            <div className="text-xs text-gray-400">JMK Facilities Management</div>
            <div className="text-xs text-gray-500 mt-1">Hotel Portal v2.0</div>
          </div>
        </div>
      </div>
    </>
  );
}

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
  pathname: string;
}

const NavItem = ({ 
  item, 
  activeStates, 
  expandedSections, 
  onToggleSection, 
  onUtilitiesClick, 
  onClick,
  pathname
}: NavItemProps) => {
  const Icon = item.icon;
  const active = activeStates.isActive(item.href);
  const isExpanded = item.hasSubItems && expandedSections.includes(item.id || '');
  const hasSubItems = item.hasSubItems && item.subItems;
  
  const isUtilitiesMainActive = item.id === 'utilities' && (active || activeStates.isUtilitiesParentActive);
  const isComplianceActive = item.id === 'compliance' && pathname.startsWith(item.href);
  const isHighlighted = active || isUtilitiesMainActive || isComplianceActive;

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

  const mainItemClasses = useMemo(() => `
    flex items-center px-3 py-2 xl:px-4 xl:py-3 rounded-lg transition-all duration-200 group flex-1
    ${isHighlighted
      ? 'bg-blue-600 text-white shadow-lg'
      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
    }
  `, [isHighlighted]);

  const iconClasses = useMemo(() => `w-4 h-4 mr-2 xl:w-5 xl:h-5 xl:mr-3 ${
    isHighlighted ? 'text-white' : 'text-gray-400 group-hover:text-white'
  }`, [isHighlighted]);

  const labelClasses = 'font-medium text-sm xl:text-base';

  const descriptionClasses = useMemo(() => `text-[11px] xl:text-xs mt-0.5 ${
    isHighlighted ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-300'
  }`, [isHighlighted]);

  return (
    <div className="mb-1 xl:mb-2">
      <div className="flex items-center">
        <Link
          href={item.href}
          className={mainItemClasses}
          onClick={handleMainClick}
        >
          <Icon className={iconClasses} />
          <div className="flex-1">
            <div className={labelClasses}>{item.label}</div>
            <div className={descriptionClasses}>{item.description}</div>
          </div>
        </Link>
        
        {/* Toggle button — utilities only */}
        {hasSubItems && (
          <button
            onClick={handleToggleClick}
            className={`p-2 mr-2 rounded transition-colors ${
              isHighlighted
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

      {/* Utilities sub items — collapsible */}
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

      {/* Compliance sub items — always visible, no toggle */}
      {item.alwaysShowSubItems && item.subItems && (
        <div className="ml-4 mt-1 space-y-1">
          {item.subItems.map((subItem: any) => (
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

interface SubNavItemProps {
  subItem: any;
  isActive: boolean;
  onClick: () => void;
}

const SubNavItem = ({ subItem, isActive, onClick }: SubNavItemProps) => {
  const SubIcon = subItem.icon;

  const subItemClasses = useMemo(() => `
    flex items-center px-2 py-1.5 xl:px-3 xl:py-2 rounded-md transition-all duration-200 group text-xs xl:text-sm
    ${isActive
      ? 'bg-blue-500 text-white shadow-md'
      : 'text-gray-400 hover:bg-slate-700 hover:text-white'
    }
  `, [isActive]);

  const subIconClasses = useMemo(() => `w-3.5 h-3.5 mr-2 xl:w-4 xl:h-4 xl:mr-3 ${
    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
  }`, [isActive]);

  const subDescriptionClasses = useMemo(() => `text-[10px] xl:text-xs mt-0.5 ${
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
        <div className={subDescriptionClasses}>{subItem.description}</div>
      </div>
    </Link>
  );
};
