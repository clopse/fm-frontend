'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hotels } from '@/lib/hotels';
import { Menu } from 'lucide-react';

// Import your existing components that we'll keep
import HotelSelectorModal from './HotelSelectorModal';
import UserPanel from './UserPanel';

// New components (replace your old ones with these)
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
  
  const isDashboardHome = /^\/hotels\/[^/]+$/.test(pathname);

  // Handle mobile detection and sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true); // Always open on desktop
      } else {
        setIsSidebarOpen(false); // Closed by default on mobile
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('auth');
      if (!isAuth) {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  const hotelId = pathname.split('/')[2];
  const currentHotelName = hotels.find((h) => h.id === hotelId)?.name || 'Select Hotel';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Header - only show on non-dashboard pages */}
      {!isDashboardHome && (
        <HeaderBar
          onHotelSelectClick={() => setIsHotelModalOpen(true)}
          currentHotelName={currentHotelName}
          onUserIconClick={() => setIsUserPanelOpen(true)}
          onMenuToggle={toggleSidebar}
        />
      )}

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
      <div className="flex h-full">
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
          flex-1 overflow-auto bg-gray-50 transition-all duration-300 ease-in-out
          ${isOpen ? 'ml-64' : 'ml-0'}
          ${!isDashboardHome ? 'pt-16' : ''}
        `}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
