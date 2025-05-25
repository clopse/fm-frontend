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
  Menu,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import UserOverview from '@/components/UserOverview';
import AdminSidebar from '@/components/AdminSidebar';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import MessagesDropdown from '@/components/MessagesDropdown';
import UserManagementModal from '@/components/UserManagementModal';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import AdminHeader from '@/components/AdminHeader';
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

export default function HotelsPage() {
  // Data state
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  
  // UI state
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showFullUserManagement, setShowFullUserManagement] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotelNames['hiex']);

  useEffect(() => {
    fetchTaskLabels();
    
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
          showAdminSidebar={showAdminSidebar}
          setShowAdminSidebar={setShowAdminSidebar}
          setIsHotelModalOpen={setIsHotelModalOpen}
          setIsUserPanelOpen={setIsUserPanelOpen}
          setShowAccountSettings={setShowAccountSettings}
          setShowFullUserManagement={setShowFullUserManagement}
        />

        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
          onSelectHotel={handleHotelSelect}
        />

        {/* Account Settings Modal */}
        <AccountSettingsModal 
          showAccountSettings={showAccountSettings}
          setShowAccountSettings={setShowAccountSettings}
        />

        {/* Full User Management Modal */}
        <UserManagementModal 
          showFullUserManagement={showFullUserManagement}
          setShowFullUserManagement={setShowFullUserManagement}
        />

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* User Overview Component */}
          <UserOverview onManageAllUsers={() => setShowFullUserManagement(true)} />

          {/* Dashboard Content Grid */}
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
    </div>
  );
}
