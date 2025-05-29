'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hotels } from '@/lib/hotels';
import { userService } from '@/services/userService';
import { isPublicTrainingPath } from '@/lib/auth';
import HotelSelectorModal from './HotelSelectorModal';
import UserPanel from './UserPanel';
import HeaderBar from './HeaderBar';
import MainSidebar from './MainSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const rawPathname = usePathname();
  const pathname = rawPathname.endsWith('/') && rawPathname !== '/'
    ? rawPathname.slice(0, -1)
    : rawPathname;
  const router = useRouter();
  
  // Check if it's the hotel dashboard home page
  const isDashboardHome = /^\/hotels\/[^/]+$/.test(pathname);
  
  // BYPASS ENTIRE MAINLAYOUT FOR TRAINING PAGES
  if (isPublicTrainingPath(pathname)) {
    return <>{children}</>;
  }
  
  // Handle mobile detection and sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // JWT Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = userService.isAuthenticated();
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  const hotelId = pathname.split('/')[2];
  const currentHotelName = hotels.find((h) => h.id === hotelId)?.name || 'Select Hotel';
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Header - Always visible */}
      <HeaderBar
        onHotelSelectClick={() => setIsHotelModalOpen(true)}
        currentHotelName={currentHotelName}
        onUserIconClick={() => setIsUserPanelOpen(true)}
        onMenuToggle={toggleSidebar}
        showHamburger={!isSidebarOpen}
      />

      {/* Modals */}
      <HotelSelectorModal 
        isOpen={isHotelModalOpen} 
        setIsOpen={setIsHotelModalOpen} 
      />
      <UserPanel 
        isOpen={isUserPanelOpen} 
        onClose={() => setIsUserPanelOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex h-full pt-16"> {/* Always account for header */}
        
        {/* Sidebar */}
        <MainSidebar
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onItemClick={() => {
            if (isMobile) setIsSidebarOpen(false);
          }}
        />

        {/* Main Content */}
        <main className={`
          flex-1 overflow-auto transition-all duration-300 ease-in-out
          ${isSidebarOpen && !isMobile ? 'ml-72' : 'ml-0'}
        `}>
          {isDashboardHome ? (
            // Dashboard gets no padding and can use full space
            <div className="h-full">
              {children}
            </div>
          ) : (
            // Other pages get standard padding and background
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-full">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
