// FILE: src/app/admin/compliance/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { hotelNames } from '@/lib/hotels';

import { ComplianceDashboardSkeleton } from '@/components/ComplianceSkeletons';

const AuditPrintSystem = dynamic(() => import('@/components/AuditPrintSystem'), {
  ssr: false,
  loading: () => <ComplianceDashboardSkeleton />,
});

export default function AdminCompliancePage() {
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const defaultHotelName = useMemo(() => hotelNames['hiex'], []);
  const [currentHotel, setCurrentHotel] = useState(defaultHotelName);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setShowAdminSidebar(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsHotelModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      <div className={`flex-1 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

        <AdminHeader
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar((v) => !v)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
          onSelectHotel={handleHotelSelect}
        />

        {showAccountSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Account settings</h2>
                <p className="text-sm text-slate-600 mt-1">Settings coming soon.</p>
              </div>
              <div className="p-6">
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowAccountSettings(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AuditPrintSystem currentHotelName={currentHotel} />
        </div>
      </div>
    </div>
  );
}
