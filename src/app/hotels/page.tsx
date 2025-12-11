// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Settings,
  Award,
  Calendar,
  Zap,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import UtilitiesGraphs from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import WeatherWarningsBox from '@/components/WeatherWarningsBox';
import { hotelNames } from '@/lib/hotels';

interface Upload {
  hotel: string;
  hotel_id?: string;
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
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/pending`);
      const data = await res.json();

      const entries = (data.entries || [])
        .sort((a: any, b: any) =>
          new Date(b.uploaded_at || b.uploadedAt).getTime() - new Date(a.uploaded_at || a.uploadedAt).getTime()
        )
        .slice(0, 10)
        .map((e: any) => ({
          hotel: hotelNames[e.hotel_id] || e.hotel_id,
          hotel_id: e.hotel_id,
          report: `${taskLabelMap[e.task_id] || e.task_id}`,
          date: e.uploaded_at || e.uploadedAt,
          reportDate: e.report_date || e.reportDate,
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



        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Dashboard Grid - Updated with Weather Warnings */}
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

            {/* Weather Warnings - Replaces Monthly Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <WeatherWarningsBox />
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
