// src/components/AppBody.tsx
'use client';

import { usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function AppBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isHotelsPage = pathname.startsWith('/hotels');

  return (
    <>
      {isHotelsPage ? (
        <>{children}</>
      ) : (
        <MainLayout>{children}</MainLayout>
      )}
    </>
  );
}
