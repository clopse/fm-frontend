'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HeaderBar from './HeaderBar';
import HotelSelectorModal from './HotelSelectorModal';
import MainSidebar from './MainSidebar';
import UserPanel from './UserPanel';
import { hotels } from '@/lib/hotels';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isUserPanelOpen, setUserPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const rawPathname = usePathname();
  const pathname = rawPathname.endsWith('/') && rawPathname !== '/'
    ? rawPathname.slice(0, -1)
    : rawPathname;
  const router = useRouter();
  
  const isDashboardHome = /^\/hotels\/[^/]+$/.test(pathname);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // Use lg breakpoint
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Open on desktop, closed on mobile by default
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth check
  useEffect(() => {
    const isAuth = localStorage.getItem('auth');
    if (!isAuth) {
      router.push('/login');
    }
  }, [pathname, router]);

  const hotelId = pathname.split('/')[2];
  const currentHotelName = hotels.find((h) => h.id === hotelId)?.name || 'Select Hotel';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - only show on non-dashboard pages */}
      {!isDashboardHome && (
        <HeaderBar
          onHotelSelectClick={() => setModalOpen(true)}
          currentHotelName={currentHotelName}
          onUserIconClick={() => setUserPanelOpen(true)}
          onMenuToggle={toggleSidebar}
        />
      )}

      {/* Modals */}
      <HotelSelectorModal isOpen={isModalOpen} setIsOpen={setModalOpen} />
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setUserPanelOpen(false)} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <MainSidebar
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onItemClick={() => isMobile && setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className={`
          flex-1 overflow-auto transition-all duration-300 ease-in-out
          ${isMobile ? '' : (isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}
        `}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
