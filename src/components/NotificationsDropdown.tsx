'use client';
import { Bell } from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function NotificationsDropdown({
  isOpen,
  onToggle
}: NotificationsDropdownProps) {
  return (
    <div className="relative" data-dropdown="notifications">
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-3">
              <Bell className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-gray-900 font-medium mb-2">Notifications Coming Soon</h4>
            <p className="text-sm text-gray-600">
              We're building a comprehensive notification system to keep you updated on important events.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
