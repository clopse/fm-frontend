'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  User2, 
  Bell,
  MessageSquare,
  Settings,
  Shield,
  UserPlus,
  Mail,
  Database,
  Download,
  Trash2,
  Edit,
  Eye,
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Users,
  Building,
  Zap,
  Droplets,
  Flame,
  Upload,
  Award,
  Calendar,
  FileText
} from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import { hotelNames } from '@/lib/hotels';

interface Upload {
  hotel: string;
  report: string;
  date: string;
  reportDate: string;
  task_id: string;
  fileUrl: string;
  uploaded_by: string;
  filename: string;
}

interface LeaderboardEntry {
  hotel: string;
  score: number;
}

interface MonthlyTask {
  task_id: string;
  frequency: string;
  confirmed: boolean;
  label?: string;
}

// Additional mock data for new features
const mockNotifications = [
  { id: 1, type: 'urgent', title: 'Fire Safety Inspection Due', message: 'Holiday Inn Express - Due in 2 days', time: '10 min ago' },
  { id: 2, type: 'info', title: 'New Compliance Report', message: 'Hampton Inn submitted monthly report', time: '1 hour ago' },
  { id: 3, type: 'warning', title: 'Budget Alert', message: 'Marina Hotel exceeded monthly utilities budget', time: '3 hours ago' }
];

const mockMessages = [
  { id: 1, from: 'Sarah Johnson', subject: 'Urgent: Elevator Issue', preview: 'The main elevator in Holiday Inn Express...', time: '5 min ago', unread: true },
  { id: 2, from: 'Mike Chen', subject: 'Monthly Report Ready', preview: 'I\'ve completed the monthly compliance...', time: '2 hours ago', unread: true },
  { id: 3, from: 'David Hurley', subject: 'New Supplier Quote', preview: 'Received quotes for the lobby renovation...', time: '1 day ago', unread: false }
];

const mockUsers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@jmkhotels.ie', role: 'Hotel Manager', hotel: 'Holiday Inn Express', status: 'Active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Mike Chen', email: 'mike@jmkhotels.ie', role: 'Maintenance Lead', hotel: 'Hampton Inn', status: 'Active', lastLogin: '1 day ago' },
  { id: 3, name: 'David Hurley', email: 'david@jmkhotels.ie', role: 'Operations Manager', hotel: 'All Hotels', status: 'Active', lastLogin: '30 min ago' }
];

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotelNames['hiex']);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  
  // New state for admin features
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showFullUserManagement, setShowFullUserManagement] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [unreadMessages, setUnreadMessages] = useState(2);

  useEffect(() => {
    fetchTaskLabels();
  }, []);

  useEffect(() => {
    if (Object.keys(taskLabelMap).length > 0) {
      fetchLeaderboard();
      fetchRecentUploads();
      fetchMonthlyChecklist();
    }
  }, [taskLabelMap]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close notifications if clicking outside
      if (showNotifications && !target.closest('[data-dropdown="notifications"]')) {
        setShowNotifications(false);
      }
      
      // Close messages if clicking outside
      if (showMessages && !target.closest('[data-dropdown="messages"]')) {
        setShowMessages(false);
      }
      
      // Close user management dropdown if clicking outside
      if (showUserManagement && !target.closest('[data-dropdown="settings"]')) {
        setShowUserManagement(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showMessages, showUserManagement]);

  const fetchTaskLabels = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`);
      const data = await res.json();
      setTaskLabelMap(data);
    } catch (err) {
      console.error('Error fetching task labels:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`);
      const data: LeaderboardEntry[] = await res.json();
      const sorted = [...data].sort((a, b) => b.score - a.score);
      setLeaderboardData(sorted);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setLeaderboardData([]);
    }
  };

  const fetchRecentUploads = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approval-log`);
      const data = await res.json();

      const entries = (data.entries || [])
        .sort((a: any, b: any) =>
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        )
        .slice(0, 10)
        .map((e: any) => ({
          hotel: hotelNames[e.hotel_id] || e.hotel_id,
          report: `${taskLabelMap[e.task_id] || e.task_id}`,
          date: e.uploaded_at,
          reportDate: e.report_date,
          task_id: e.task_id,
          fileUrl: e.fileUrl,
          uploaded_by: e.uploaded_by,
          filename: e.filename
        }));

      setRecentUploads(entries);
    } catch (err) {
      console.error('Error loading uploads:', err);
    }
  };

  const fetchMonthlyChecklist = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly/all`);
      const data: MonthlyTask[] = await res.json();

      const filtered = data.filter(t =>
        t.frequency?.toLowerCase() === 'monthly' && !t.confirmed
      ).map(t => ({
        ...t,
        label: taskLabelMap[t.task_id] || t.task_id
      }));

      setMonthlyTasks(filtered);
    } catch (err) {
      console.error('Error loading checklist:', err);
    }
  };

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsHotelModalOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/jmk-logo.png" alt="JMK Hotels" width={180} height={45} className="object-contain" />
            </div>
            
            {/* Admin Tools & Navigation */}
            <div className="flex items-center space-x-4">
              
              {/* Notifications */}
              <div className="relative" data-dropdown="notifications">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockNotifications.map(notification => (
                        <div key={notification.id} className={`p-4 border-b border-gray-100 ${getNotificationBg(notification.type)}`}>
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-800">View All Notifications</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="relative" data-dropdown="messages">
                <button 
                  onClick={() => setShowMessages(!showMessages)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                
                {showMessages && (
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

              {/* Admin Tools Dropdown */}
              <div className="relative" data-dropdown="settings">
                <button 
                  onClick={() => setShowUserManagement(!showUserManagement)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Admin Tools"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {showUserManagement && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <button 
                        onClick={() => {setShowFullUserManagement(true); setShowUserManagement(false);}}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Manage Users</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Shield className="w-4 h-4" />
                        <span>User Permissions</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Database className="w-4 h-4" />
                        <span>System Settings</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                        <Download className="w-4 h-4" />
                        <span>Export Data</span>
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button 
                        onClick={() => setShowAccountSettings(true)}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <User2 className="w-4 h-4" />
                        <span>Account Settings</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel Selector */}
              <button 
                onClick={() => setIsHotelModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Building className="w-4 h-4" />
                <span>{currentHotel}</span>
                <span>⌄</span>
              </button>
              
              <button 
                onClick={() => setIsUserPanelOpen(true)} 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Account"
              >
                <User2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <HotelSelectorModal
        isOpen={isHotelModalOpen}
        setIsOpen={setIsHotelModalOpen}
        onSelectHotel={handleHotelSelect}
      />

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
              <button onClick={() => setShowAccountSettings(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" defaultValue="Admin User" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full p-3 border border-gray-300 rounded-lg" defaultValue="admin@jmkhotels.ie" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option>System Administrator</option>
                    <option>Operations Manager</option>
                    <option>Hotel Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">SMS alerts for urgent issues</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Weekly summary reports</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button 
                  onClick={() => setShowAccountSettings(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full User Management Modal */}
      {showFullUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">User Management System</h2>
              <button onClick={() => setShowFullUserManagement(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                  />
                  <select className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option>All Roles</option>
                    <option>Hotel Manager</option>
                    <option>Operations Manager</option>
                    <option>Maintenance Lead</option>
                    <option>System Admin</option>
                  </select>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option>All Hotels</option>
                    <option>Holiday Inn Express</option>
                    <option>Hampton Inn</option>
                    <option>Holiday Inn</option>
                    <option>Marina Hotel</option>
                  </select>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hotel Access</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.hotel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 15, 2024</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-600 hover:text-blue-800" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-green-600 hover:text-green-800" title="Edit User">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-gray-800" title="Send Email">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-yellow-600 hover:text-yellow-800" title="Reset Password">
                              <Shield className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800" title="Deactivate">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing 1 to 3 of 47 users
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Previous</button>
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">2</button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">3</button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick User Overview - Show only 3 most recent users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Overview</h2>
                <p className="text-sm text-gray-500">47 total users across all hotels</p>
              </div>
            </div>
            <button 
              onClick={() => setShowFullUserManagement(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Manage All Users</span>
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">43</p>
                    <p className="text-sm text-green-700">Active Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900">3</p>
                    <p className="text-sm text-yellow-700">Pending Setup</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">1</p>
                    <p className="text-sm text-red-700">Inactive Users</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Recent User Activity</h3>
              {mockUsers.slice(0, 3).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role} • {user.hotel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Last login</p>
                    <p className="text-sm text-gray-900">{user.lastLogin}</p>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setShowFullUserManagement(true)}
                className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                View all 47 users →
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Compliance Leaderboard */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Compliance Leaderboard</h2>
              </div>
              <span className="text-sm text-gray-500"></span>
            </div>
            <ComplianceLeaderboard data={leaderboardData} />
          </div>

          {/* Monthly Tasks Alert */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {monthlyTasks.length > 0 ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pending Monthly Tasks</h3>
                </div>
                <div className="space-y-3">
                  {monthlyTasks.slice(0, 5).map((task) => (
                    <div key={task.task_id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm text-gray-900">{task.label}</span>
                    </div>
                  ))}
                  {monthlyTasks.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{monthlyTasks.length - 5} more tasks
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Tasks Complete</h3>
                <p className="text-gray-500">No pending monthly tasks at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Utilities Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Hotel Utilities Comparison</h2>
            </div>
          </div>
          <UtilitiesGraphs />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Upload Activity</h2>
            </div>
          </div>
          <RecentUploads uploads={recentUploads} />
        </div>

      </div>
    </div>
  );
}
