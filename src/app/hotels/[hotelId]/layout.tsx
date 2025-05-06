// /src/app/hotels/[hotelId]/layout.tsx
'use client';

import HotelLayout from '@/components/HotelLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HotelLayout>{children}</HotelLayout>;
}
