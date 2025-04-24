// src/components/MainLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HeaderBar from './HeaderBar';
import HotelSelectorModal from './HotelSelectorModal';
import MainSidebar from './MainSidebar';
import UserPanel from './UserPanel';
import { hotels } from '@/lib/hotels';
import { Menu, ArrowLeft, User2 } from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isUserPanelOpen, setUserPanelOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const hotelId = pathname.split('/')[2];
  const currentHotelName = hotels.find((h) => h.id === hotelId)?.name || 'Select Hotel';

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // default closed on mobile
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isAuth = localStorage.getItem('auth');
    if (!isAuth && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname]);

  if (isLoginPage) return <>{children}</>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div
        className={`${styles.sidebarWrapper} ${isMobile && isSidebarOpen ? 'open' : ''}`}
        style={{
          transform: isMobile && !isSidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <MainSidebar isMobile={isMobile} onItemClick={() => isMobile && setSidebarOpen(false)} />
      </div>

      {/* Toggle button */}
      <button
        className={styles.toggleSidebarButton}
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <HeaderBar
          currentHotelName={currentHotelName}
          onHotelSelectClick={() => setModalOpen(true)}
        />
        <HotelSelectorModal isOpen={isModalOpen} setIsOpen={setModalOpen} />
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setUserPanelOpen(false)} />
        {children}
      </div>
    </div>
  );
}
