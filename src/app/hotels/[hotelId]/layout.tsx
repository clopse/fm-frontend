// src/app/hotels/[hotelId]/layout.tsx
'use client';
import { usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function HotelDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // If it's a training page, render children without MainLayout
  if (pathname.includes('/training/')) {
    return <>{children}</>;
  }

  // Otherwise use the MainLayout
  return <MainLayout>{children}</MainLayout>;
}
