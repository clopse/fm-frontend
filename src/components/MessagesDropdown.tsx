'use client';

import { MessageSquare } from 'lucide-react';

interface Message {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
}

interface MessagesDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
}

const mockMessages: Message[] = [
  { id: 1, from: 'Sarah Johnson', subject: 'Urgent: Elevator Issue', preview: 'The main elevator in Holiday Inn Express...', time: '5 min ago', unread: true },
  { id: 2, from: 'Mike Chen', subject: 'Monthly Report Ready', preview: 'I\'ve completed the monthly compliance...', time: '2 hours ago', unread: true },
  { id: 3, from: 'David Hurley', subject: 'New Supplier Quote', preview: 'Received quotes for the lobby renovation...', time: '1 day ago', unread: false }
];

export default function MessagesDropdown({ isOpen, onToggle, unreadCount }: MessagesDropdownProps) {
  return (
    <div className="relative" data-dropdown="messages">
      <button 
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Messages</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {mockMessages.map(message => (
              <div key={message.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${message.unread ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{message.from.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900">{message.from}</p>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{message.subject}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{message.preview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 text-center border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-800">View All Messages</button>
          </div>
        </div>
      )}
    </div>
  );
}
