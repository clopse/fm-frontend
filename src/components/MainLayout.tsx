// MainLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HeaderBar from './HeaderBar';
import HotelSelectorModal from './HotelSelectorModal';
import MainSidebar from './MainSidebar';
import UserPanel from '@/components/UserPanel';
import { hotels } from '@/lib/hotels';
import { User2, ArrowLeft, Menu } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isUserPanelOpen, setUserPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';
  const isDashboardHome = /^\/hotels\/[^/]+$/.test(pathname);

  const hideSidebarPages = ['/login'];
  const shouldShowSidebar = !hideSidebarPages.some((path) => pathname.startsWith(path));

  // Resize listener to toggle mobile mode and default sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Close on mobile by default
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    const isAuth = localStorage.getItem('auth');
    if (!isAuth && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const hotelId = pathname.split('/')[2];
  const currentHotelName = hotels.find((h) => h.id === hotelId)?.name || 'Select Hotel';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      {!isDashboardHome && (
        <HeaderBar
          onHotelSelectClick={() => setModalOpen(true)}
          currentHotelName={currentHotelName}
        />
      )}
      <HotelSelectorModal isOpen={isModalOpen} setIsOpen={setModalOpen} />

      {/* User icon */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 1000 }}>
        <button
          onClick={() => setUserPanelOpen(true)}
          style={{
            background: 'white',
            borderRadius: '50%',
            border: '1px solid #ccc',
            padding: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
          }}
          title="Account"
        >
          <User2 size={20} />
        </button>
      </div>
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setUserPanelOpen(false)} />

      {/* Sidebar toggle */}
      {shouldShowSidebar && isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="sidebarToggleArrow"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <ArrowLeft size={24} /> : <Menu size={24} />}
        </button>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        {shouldShowSidebar && (
          <div
            style={{
              width: '250px',
              backgroundColor: '#f8f9fa',
              height: '100%',
              transition: 'transform 0.3s ease',
              position: isMobile ? 'fixed' : 'relative',
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              zIndex: 1000,
              boxShadow: isMobile ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <MainSidebar isMobile={isMobile} onItemClick={() => isMobile && setIsSidebarOpen(false)} />
          </div>
        )}

        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isDashboardHome ? '0' : '1rem',
            width: '100%',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
