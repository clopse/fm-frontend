// src/app/hotels/[hotelId]/layout.tsx
'use client';

import MainSidebar from '@/components/MainSidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layoutContainer">
      <MainSidebar />
      <main className="layoutContent">
        {children}
      </main>
    </div>
  );
}
