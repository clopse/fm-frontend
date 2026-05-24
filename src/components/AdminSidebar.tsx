'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileSearch,
  Receipt,
  Settings,
  GraduationCap,
  Building,
  FolderOpen,
  ScrollText,
  ShieldCheck,
  X,
  Menu
} from 'lucide-react';
import { getJwtClaims } from '@/lib/auth';

interface AdminSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const BADGE: React.CSSProperties = {
  fontSize: 10,
  backgroundColor: 'var(--accent)',
  color: '#fff',
  padding: '2px 6px',
  borderRadius: 4,
  fontWeight: 700,
  letterSpacing: '0.05em',
  lineHeight: 1,
};

export default function AdminSidebar({
  isMobile = false,
  isOpen = true,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    const { new_role } = getJwtClaims();
    setShowPermissions(
      new_role === 'system_admin' || new_role === 'group_admin' || new_role === 'hotel_admin'
    );
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const navItems = [
    { label: 'Dashboard',        href: '/hotels',           icon: LayoutDashboard, description: 'Main admin overview' },
    { label: 'Audit Files',      href: '/admin/audit',      icon: FileSearch,      description: 'Historical audit documents' },
    { label: 'Utilities Manager',href: '/admin/utilities',  icon: Receipt,         description: 'View and manage utility bills' },
    { label: 'User Management',  href: '/admin/users',      icon: Users,           description: 'Manage all system users' },
    { label: 'Courses & Training',href: '/admin/training',  icon: GraduationCap,   description: 'Manage staff training' },
    { label: 'Hotel Management', href: '/admin/hotels',     icon: Building,        description: 'Manage hotel properties' },
    { label: 'System Settings',  href: '/admin/settings',   icon: Settings,        description: 'Platform configuration' },
  ];

  const linkClass = (active: boolean) =>
    `flex items-center px-3 py-2 xl:px-4 xl:py-3 rounded-lg mb-1 xl:mb-2 transition-all duration-200 group ${
      active
        ? 'bg-sidebar-active text-sidebar-text'
        : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'
    }`;

  const iconClass = (active: boolean) =>
    `w-4 h-4 mr-2 xl:w-5 xl:h-5 xl:mr-3 ${active ? 'text-accent' : 'text-sidebar-icon group-hover:text-sidebar-text'}`;

  const labelClass = 'font-medium text-sm xl:text-base';

  const descClass = (active: boolean) =>
    `text-[11px] xl:text-xs mt-0.5 ${active ? 'text-text-muted' : 'text-sidebar-section group-hover:text-sidebar-muted'}`;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={onClose} />
      )}

      <div className={`
        fixed top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border text-sidebar-text z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 xl:p-6 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link href="/hotels" onClick={() => isMobile && onClose?.()}>
              <img
                src="/jmk-logo.png"
                alt="JMK Logo"
                className="h-8 xl:h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover rounded-lg transition-colors"
              title={isMobile ? 'Close Menu' : 'Hide Sidebar'}
            >
              {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-3 xl:mt-6 px-3 xl:px-4 flex-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon, description }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={linkClass(active)}
                onClick={() => isMobile && onClose?.()}
              >
                <Icon className={iconClass(active)} />
                <div className="flex-1">
                  <div className={labelClass}>{label}</div>
                  <div className={descClass(active)}>{description}</div>
                </div>
              </Link>
            );
          })}

          {/* Projects + Rules — separated section */}
          <div className="mt-2 pt-2 border-t border-sidebar-border">
            {/* Projects */}
            <Link
              href="/projects"
              className={linkClass(isActive('/projects'))}
              onClick={() => isMobile && onClose?.()}
            >
              <FolderOpen className={iconClass(isActive('/projects'))} />
              <div className="flex-1">
                <div className={`${labelClass} flex items-center gap-2`}>
                  Projects
                  <span style={BADGE}>NEW</span>
                </div>
                <div className={descClass(isActive('/projects'))}>
                  Development &amp; Pre-Opening
                </div>
              </div>
            </Link>

            {/* Rules & Standards */}
            <Link
              href="/rules"
              className={linkClass(isActive('/rules'))}
              onClick={() => isMobile && onClose?.()}
            >
              <ScrollText className={iconClass(isActive('/rules'))} />
              <div className="flex-1">
                <div className={`${labelClass} flex items-center gap-2`}>
                  Rules &amp; Standards
                  <span style={BADGE}>NEW</span>
                </div>
                <div className={descClass(isActive('/rules'))}>
                  Group rules and brand standards
                </div>
              </div>
            </Link>

            {/* Permissions */}
            {showPermissions && (
              <Link
                href="/admin/permissions"
                className={linkClass(isActive('/admin/permissions'))}
                onClick={() => isMobile && onClose?.()}
              >
                <ShieldCheck className={iconClass(isActive('/admin/permissions'))} />
                <div className="flex-1">
                  <div className={labelClass}>Permissions</div>
                  <div className={descClass(isActive('/admin/permissions'))}>
                    Manage user access &amp; modules
                  </div>
                </div>
              </Link>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 xl:p-4 border-t border-sidebar-border bg-sidebar flex-shrink-0">
          <div className="text-center">
            <div className="text-xs text-sidebar-muted">JMK Facilities Management</div>
            <div className="text-xs text-sidebar-section mt-1">Admin Portal v2.0</div>
          </div>
        </div>
      </div>
    </>
  );
}
