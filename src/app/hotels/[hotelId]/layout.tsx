// src/app/hotels/[hotelId]/layout.tsx
'use client';

import MainLayout from '@/components/MainLayout';

export default function HotelDashboardLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
