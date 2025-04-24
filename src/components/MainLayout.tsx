'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HeaderBar from './HeaderBar';
import HotelSelectorModal from './HotelSelectorModal';
import MainSidebar from './MainSidebar';
import UserPanel from '@/components/UserPanel';
import { hotels } from '@/lib/hotels';
import { User2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';
  const isDashboardHome = /^\/hotels\/[^/]+$/.test(pathname); // Matches only /hotels/hotelId

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    const isAuth = localStorage.getItem('auth');
    if (!isAuth && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, isLoginPage, router]);

  // ✅ Allow login page through
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

      {/* ✅ Floating logout button */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 1000 }}>
        <button
          onClick={() => {
            localStorage.removeItem('auth');
            router.push('/login');
          }}
          style={{
            background: 'white',
            borderRadius: '50%',
            border: '1px solid #ccc',
            padding: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
          }}
          title="Logout"
        >
          <User2 size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <MainSidebar />
        <main style={{ flex: 1, overflow: 'auto', padding: isDashboardHome ? '0' : '1rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
