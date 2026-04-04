'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  ShieldCheck,
  PlugZap,
  FileText,
  X,
  Menu,
  Home,
  ChevronDown,
  ChevronRight,
  Zap,
  Flame,
  Droplets,
  BarChart3,
  FolderOpen,
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
  onClose,
}: MainSidebarProps) {
  const { hotelId } = useParams();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['utilities']);

  const navItems = useMemo(() => [
    {
      label: 'Dashboard',
      href: `/hotels/${hotelId}`,
      icon: Home,
      description: 'Hotel overview',
    },
    {
      label: 'Drawings',
      href: `/hotels/${hotelId}/building`,
      icon: Building2,
      description: 'Property and infrastructure',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      href: `/hotels/${hotelId}/compliance`,
      icon: ShieldCheck,
      description: 'Safety and regulatory compliance',
      hasSubItems: true,
      alwaysExpanded: true,
      subItems: [
        {
          label: 'Compliance Reports',
          href: `/hotels/${hotelId}/compliance-reports`,
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
          description: 'Dashboard with KPIs and charts',
        },
        {
          label: 'Electricity',
          href: `/hotels/${hotelId}/utilities/electricity`,
          icon: Zap,
          description: 'Detailed electricity analysis',
        },
        {
          label: 'Gas',
          href: `/hotels/${hotelId}/utilities/gas`,
          icon: Flame,
          description: 'Gas consumption tracking',
        },
        {
          label: 'Water',
          href: `/hotels/${hotelId}/utilities/water`,
          icon: Droplets,
          description: 'Water usage monitoring',
        },
      ],
    },
    {
      label: 'Assets',
      href: `/hotels/${hotelId}/assets`,
      icon: FileText,
      description: 'Asset Register',
    },
  ], [hotelId]);

  const activeStates = useMemo(() => ({
    isActive: (path: string) => pathname === path,
    isParentActive: (id: string) => {
      if (id === 'utilities') return pathname.startsWith(`/hotels/${hotelId}/utilities`);
      if (id === 'compliance') return pathname.startsWith(`/hotels/${hotelId}/compliance`);
      return false;
    },
  }), [pathname, hotelId]);

  const handleClick = useCallback(() => {
    if (onItemClick) onItemClick();
  }, [onItemClick]);

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

  const sidebarClasses = `
    fixed top-0 left-0 h-full bg-slate-800 text-white z-50 transition-transform duration-300 ease-in-out w-72
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={onClose} />
      )}

      <div className={sidebarClasses}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <Link href="https://jmkfacilities.ie/hotels" onClick={handleLogoClick}>
              <img
                src="/jmk-logo.png"
                alt="JMK Logo"
                className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={isMobile ? 'Close Menu' : 'Hide Sidebar'}
            >
              {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-6 px-4 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem
              key={item.href}
              item={item}
              activeStates={activeStates}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onClick={handleClick}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-xs text-gray-400">Facilities Management 2026</div>
            <div className="text-xs text-gray-500 mt-1">Hotel Portal v2.41</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  item: any;
  activeStates: {
    isActive: (path: string) => boolean;
    isParentActive: (id: string) => boolean;
  };
  expandedSections: string[];
  onToggleSection: (id: string) => void;
  onClick: () => void;
}

const NavItem = ({ item, activeStates, expandedSections, onToggleSection, onClick }: NavItemProps) => {
  const Icon = item.icon;
  const active = activeStates.isActive(item.href);
  const parentActive = item.id ? activeStates.isParentActive(item.id) : false;
  const isHighlighted = active || parentActive;

  // Always expanded if flagged, otherwise controlled by state
  const isExpanded = item.alwaysExpanded || (item.hasSubItems && expandedSections.includes(item.id || ''));
  const canToggle = item.hasSubItems && !item.alwaysExpanded;

  return (
    <div className="mb-1">
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group flex-1 ${
            isHighlighted
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Icon className={`w-5 h-5 mr-3 ${isHighlighted ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            <div className={`text-xs mt-0.5 ${isHighlighted ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-300'}`}>
              {item.description}
            </div>
          </div>
        </Link>

        {canToggle && (
          <button
            onClick={() => onToggleSection(item.id)}
            className={`p-2 mr-2 rounded transition-colors ${
              isHighlighted
                ? 'text-white hover:bg-blue-700'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Sub items */}
      {item.hasSubItems && isExpanded && item.subItems && (
        <div className="ml-4 mt-1 space-y-1">
          {item.subItems.map((sub: any) => {
            const SubIcon = sub.icon;
            const subActive = activeStates.isActive(sub.href);
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onClick}
                className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 group text-sm ${
                  subActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <SubIcon className={`w-4 h-4 mr-3 ${subActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <div className="flex-1">
                  <div className="font-medium">{sub.label}</div>
                  <div className={`text-xs mt-0.5 ${subActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-400'}`}>
                    {sub.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
