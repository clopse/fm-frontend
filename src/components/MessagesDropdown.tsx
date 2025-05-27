'use client';
import { MessageSquare } from 'lucide-react';

interface MessagesDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MessagesDropdown({ isOpen, onToggle }: MessagesDropdownProps) {
  return (
    <div className="relative" data-dropdown="messages">
      <button 
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Messages</h3>
          </div>
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-3">
              <MessageSquare className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-gray-900 font-medium mb-2">Messages Coming Soon</h4>
            <p className="text-sm text-gray-600">
              We're working on bringing you a seamless messaging experience. Stay tuned!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
