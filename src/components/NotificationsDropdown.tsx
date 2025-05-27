'use client';

import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';

interface Notification {
  id: number;
  type: 'urgent' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
  notifications: Notification[];
}

export default function NotificationsDropdown({
  isOpen,
  onToggle,
  unreadCount,
  notifications
}: NotificationsDropdownProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative" data-dropdown="notifications">
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications.
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 ${getNotificationBg(notification.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 text-center border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
