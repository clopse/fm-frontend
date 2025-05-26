// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  User2, 
  Bell,
  MessageSquare,
  Settings,
  Building,
  Award,
  Calendar,
  Zap,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import UserManagementModal from '@/components/UserManagementModal';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { hotelNames } from '@/lib/hotels';
import { User } from '@/types/user';
import { userService } from '@/services/userService';

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

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  roles: Record<string, number>;
  hotels: Record<string, number>;
}

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showFullUserManagement, setShowFullUserManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotelNames['hiex']);
  
  // User data states
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    roles: {},
    hotels: {}
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskLabels();
    fetchUserData();
    
    // Handle mobile detection
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowAdminSidebar(true);
      } else {
        setShowAdminSidebar(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (Object.keys(taskLabelMap).length > 0) {
      fetchLeaderboard();
      fetchRecentUploads();
      fetchMonthlyChecklist();
    }
  }, [taskLabelMap]);

  const fetchUserData = async () => {
    try {
      setLoadingUsers(true);
      setUserError(null);

      // Check if user is authenticated
      if (!userService.isAuthenticated()) {
        setUserError('Please log in to view user data');
        return;
      }

      // Fetch all users and stats in parallel
      const [usersData, statsData] = await Promise.all([
        userService.getUsers(),
        userService.getUserStats()
      ]);

      setUsers(usersData);
      setUserStats(statsData);

      // Get recent users (sorted by last_login, then created_at)
      const sortedUsers = [...usersData].sort((a, b) => {
        const aTime = new Date(a.last_login || a.created_at).getTime();
        const bTime = new Date(b.last_login || b.created_at).getTime();
        return bTime - aTime;
      });
      setRecentUsers(sortedUsers.slice(0, 3));

    } catch (err) {
      console.error('Error fetching user data:', err);
      setUserError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoadingUsers(false);
    }
  };

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

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never';
    
    const loginDate = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const onUserManagementUpdate = () => {
    fetchUserData(); // Refresh user data when user management updates
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar 
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

        {/* Admin Header */}
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

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
                <p>Account settings content goes here...</p>
                <div className="flex justify-end space-x-3 mt-6">
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

        <UserManagementModal 
          isOpen={showFullUserManagement}
          onClose={() => setShowFullUserManagement(false)}
          onUserUpdate={onUserManagementUpdate}
        />

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  User2, 
  Bell,
  MessageSquare,
  Settings,
  Building,
  Award,
  Calendar,
  Zap,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import UserManagementModal from '@/components/UserManagementModal';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { hotelNames } from '@/lib/hotels';
import { userService } from '@/services/userService';

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

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  roles: Record<string, number>;
  hotels: Record<string, number>;
}

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showFullUserManagement, setShowFullUserManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotelNames['hiex']);
  
  // Simple user stats only
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    roles: {},
    hotels: {}
  });
  const [loadingUserStats, setLoadingUserStats] = useState(true);

  useEffect(() => {
    fetchTaskLabels();
    fetchUserStats();
    
    // Handle mobile detection
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowAdminSidebar(true);
      } else {
        setShowAdminSidebar(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (Object.keys(taskLabelMap).length > 0) {
      fetchLeaderboard();
      fetchRecentUploads();
      fetchMonthlyChecklist();
    }
  }, [taskLabelMap]);

  const fetchUserStats = async () => {
    try {
      setLoadingUserStats(true);
      if (userService.isAuthenticated()) {
        const statsData = await userService.getUserStats();
        setUserStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    } finally {
      setLoadingUserStats(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar 
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

        {/* Admin Header */}
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

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
                <p>Account settings content goes here...</p>
                <div className="flex justify-end space-x-3 mt-6">
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

        <UserManagementModal 
          isOpen={showFullUserManagement}
          onClose={() => setShowFullUserManagement(false)}
        />

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* User Overview - Simple Stats Only */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Overview</h2>
                <p className="text-sm text-gray-500">
                  {loadingUserStats ? 'Loading...' : `${userStats.total_users} total users across all hotels`}
                </p>
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
            {loadingUserStats ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading user statistics...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-900">{userStats.active_users}</p>
                      <p className="text-sm text-green-700">Active Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{userStats.total_users}</p>
                      <p className="text-sm text-blue-700">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-900">{userStats.inactive_users}</p>
                      <p className="text-sm text-red-700">Inactive Users</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Compliance Leaderboard */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Compliance Leaderboard</h2>
              </div>
              <span className="text-sm text-gray-500">Updated daily</span>
            </div>
            <ComplianceLeaderboard data={leaderboardData} />
          </div>

          {/* Monthly Tasks */}
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

        {/* Utilities */}
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
    </div>
  );
}
