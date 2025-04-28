// src/app/hotels/layout.tsx
'use client';

import { ReactNode } from 'react';

export default function HotelsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}
