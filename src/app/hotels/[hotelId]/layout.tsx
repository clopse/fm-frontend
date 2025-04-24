// src/app/hotels/[hotelId]/layout.tsx
import MainLayout from '@/components/MainLayout';
import type { ReactNode } from 'react';

export default function HotelLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
