'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HeaderBar from './HeaderBar';
import HotelSelectorModal from './HotelSelectorModal';
import MainSidebar from './MainSidebar';
import UserPanel from './UserPanel';
import { hotels } from '@/lib/hotels';
import { User2, ArrowLeft, Menu } from 'lucide-react';
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

  const isLoginPage = pathname === '/login';
  const isHotelsPage = pathname === '/hotels' || pathname.startsWith('/hotels/');
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
    if (!isAuth && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, isLoginPage, router]);

  // 🔥 KEY: If on login page or hotels page, no sidebar or layout wrapping
  if (isLoginPage || isHotelsPage) {
    return <>{children}</>;
  }

  const hotelId = pathname.split('/')[2];
  const currentHotelName = hotels.find((h) => h.id === hotelId)?.name || 'Select Hotel';
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {!isDashboardHome && (
        <HeaderBar
          onHotelSelectClick={() => setModalOpen(true)}
          currentHotelName={currentHotelName}
        />
      )}

      <HotelSelectorModal isOpen={isModalOpen} setIsOpen={setModalOpen} />

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

      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 1100 }}>
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
    </div>
  );
}
