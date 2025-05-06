'use client';

import MainSidebar from '@/components/MainSidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '200px', backgroundColor: '#001f3f', color: 'white' }}>
        <MainSidebar />
      </aside>
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
