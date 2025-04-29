'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HeaderBar from './HeaderBar';
import HotelSelectorModal from './HotelSelectorModal';
import MainSidebar from './MainSidebar';
import UserPanel from './UserPanel';
import { hotels } from '@/lib/hotels';
import { ArrowLeft, Menu } from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {!isDashboardHome && (
        <HeaderBar
          onHotelSelectClick={() => setModalOpen(true)}
          currentHotelName={currentHotelName}
          onUserIconClick={() => setUserPanelOpen(true)} // pass user icon toggle
        />
      )}

      <HotelSelectorModal isOpen={isModalOpen} setIsOpen={setModalOpen} />
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setUserPanelOpen(false)} />

      <div className={styles.toggleSidebarButton} onClick={toggleSidebar}>
        {isSidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
      </div>

      <div style={{ display: 'flex', width: '100%' }}>
        <aside className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.open : ''}`}>
          <MainSidebar
            isMobile={isMobile}
            onItemClick={() => isMobile && setIsSidebarOpen(false)}
          />
        </aside>

        <main className={`${styles.mainContent} ${isSidebarOpen ? styles.shifted : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
