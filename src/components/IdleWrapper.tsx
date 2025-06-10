// FILE: src/components/IdleWrapper.tsx
'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { userService } from '@/services/userService';
import { idleService } from '@/services/idleService';

export default function IdleWrapper({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(5 * 60); // 5 minutes in seconds
  const pathname = usePathname();

  useEffect(() => {
    // Don't start idle tracking on login page
    if (pathname === '/login') {
      idleService.stopTracking();
      return;
    }

    // Only start idle tracking if user is authenticated
    if (userService.isAuthenticated()) {
      // Start idle tracking with custom warning handler
      idleService.startTracking(() => {
        setShowWarning(true);
        startCountdown();
      });
    }

    // Cleanup on unmount or route change
    return () => {
      if (pathname === '/login') {
        idleService.stopTracking();
      }
    };
  }, [pathname]);

  const startCountdown = () => {
    let countdown = 5 * 60; // Reset to 5 minutes
    setWarningCountdown(countdown);
    
    const interval = setInterval(() => {
      countdown -= 1;
      setWarningCountdown(countdown);
      
      if (countdown <= 0) {
        clearInterval(interval);
        // Time's up - the idle service will handle logout
      }
    }, 1000);
  };

  const handleContinueSession = () => {
    setShowWarning(false);
    setWarningCountdown(5 * 60); // Reset countdown
    idleService.extendSession();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    idleService.stopTracking();
    userService.logout();
    window.location.href = '/login';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <div className="text-center">
              <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Session Expiring Soon
              </h3>
              <p className="text-gray-600 mb-4">
                Your session will expire in{' '}
                <span className="font-bold text-red-600">
                  {formatTime(warningCountdown)}
                </span>{' '}
                due to inactivity.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleContinueSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue Session
                </button>
                <button
                  onClick={handleLogoutNow}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors font-medium"
                >
                  Logout Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
