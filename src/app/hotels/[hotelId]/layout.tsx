// src/app/hotels/[hotelId]/layout.tsx
export default function HotelLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
