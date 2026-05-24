'use client';

import { useEffect, useState } from 'react';

export default function ForbiddenToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("You don't have access to this resource");

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) setMessage(detail.message);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }
    window.addEventListener('jmk:forbidden', handler);
    return () => window.removeEventListener('jmk:forbidden', handler);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position:     'fixed',
      bottom:       24,
      right:        24,
      zIndex:       9999,
      background:   '#1e293b',
      color:        '#f8fafc',
      padding:      '12px 20px',
      borderRadius: 10,
      fontSize:     14,
      fontWeight:   500,
      boxShadow:    '0 8px 32px rgba(0,0,0,0.3)',
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      maxWidth:     360,
      lineHeight:   1.4,
    }}>
      <span style={{ fontSize: 16 }}>🚫</span>
      {message}
    </div>
  );
}
