// FILE: src/app/admin/training/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  GraduationCap,
  Users,
  Mail,
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Upload,
  Download,
  AlertTriangle,
  RefreshCw,
  Save,
  Copy,
  Filter,
  Search,
  Eye,
  FileText,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import { hotelNames } from '@/lib/hotels';

interface TrainingResult {
  hotel_id: string;
  employee_name: string;
  employee_email: string;
  employee_id?: string;
  score: number;
  total_questions: number;
  passed: boolean;
  completion_time_minutes: number;
  answers: any[];
  submitted_at: string;
  course_type: 'fire_induction';
  certificate_issued?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  type: 'fire_induction' | 'health_safety' | 'food_safety' | 'security';
  duration_minutes: number;
  passing_score: number;
  total_questions: number;
  active: boolean;
  course_url: string;
  created_at: string;
  updated_at: string;
  mandatory: boolean;
  certificate_template?: string;
}

const defaultCourses: Course[] = [
  {
    id: 'fire_induction',
    title: 'Fire Safety Induction',
    description: 'Comprehensive fire safety training covering emergency procedures, equipment usage, and evacuation protocols for hotel staff.',
    type: 'fire_induction',
    duration_minutes: 45,
    passing_score: 80,
    total_questions: 20,
    active: true,
    course_url: '/training/fire-induction',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    mandatory: true,
    certificate_template: 'fire_safety_cert.pdf'
  }
];

export default function TrainingManagementPage() {
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [trainingResults, setTrainingResults] = useState<TrainingResult[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course>(defaultCourses[0]);
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Bulk email invitation state
  const [emailListText, setEmailListText] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [invitationSubject, setInvitationSubject] = useState('Complete Your Fire Safety Training');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  
  // Filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Layout state
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
    
    // Load training results
    loadTrainingResults();
    
    // Set default invitation message
    setInvitationMessage(`Dear Team Member,

You are required to complete the Fire Safety Induction training as part of our ongoing commitment to workplace safety.

Please click the link below to access the training:
[TRAINING_LINK]

This training typically takes 45 minutes to complete and you must achieve a score of 80% or higher to receive certification.

Upon successful completion, you will receive a certificate that must be kept on file.

If you have any questions, please contact your manager or the training administrator.

Best regards,
JMK Facilities Management Team`);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTrainingResults = async () => {
    setIsLoading(true);
    try {
      // Fetch training results from your API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/training/results`);
      if (response.ok) {
        const results = await response.json();
        setTrainingResults(results);
      }
    } catch (error) {
      console.error('Error loading training results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseEmailList = (text: string) => {
    // Parse emails from various formats (comma separated, line separated, Excel paste, etc.)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex) || [];
    
    // Remove duplicates and validate
    const uniqueEmails = [...new Set(emails)].filter(email => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      return isValid;
    });
    
    setParsedEmails(uniqueEmails);
  };

  const handleEmailTextChange = (text: string) => {
    setEmailListText(text);
    parseEmailList(text);
  };

  const sendBulkInvitations = async () => {
    if (parsedEmails.length === 0) return;
    
    setIsSendingInvites(true);
    setSendProgress(0);
    
    try {
      const trainingLink = `${window.location.origin}${selectedCourse.course_url}`;
      const messageWithLink = invitationMessage.replace('[TRAINING_LINK]', trainingLink);
      
      // Simulate sending emails with progress
      for (let i = 0; i < parsedEmails.length; i++) {
        // Simulate API call to send email
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // In real implementation, call your email API here
        // await sendTrainingInvitationEmail({
        //   to: parsedEmails[i],
        //   subject: invitationSubject,
        //   message: messageWithLink,
        //   courseId: selectedCourse.id
        // });
        
        setSendProgress(((i + 1) / parsedEmails.length) * 100);
      }
      
      setSaveMessage(`Successfully sent ${parsedEmails.length} training invitations!`);
      setTimeout(() => setSaveMessage(''), 3000);
      
      // Clear form
      setEmailListText('');
      setParsedEmails([]);
      
    } catch (error) {
      setSaveMessage('Error sending invitations. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSendingInvites(false);
      setSendProgress(0);
    }
  };

  const exportResults = () => {
    const csv = convertToCSV(filteredResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: TrainingResult[]) => {
    const headers = ['Hotel', 'Employee Name', 'Email', 'Score', 'Passed', 'Completion Time', 'Submitted At', 'Certificate Issued'];
    const rows = data.map(result => [
      hotelNames[result.hotel_id] || result.hotel_id,
      result.employee_name,
      result.employee_email,
      `${result.score}%`,
      result.passed ? 'Yes' : 'No',
      `${result.completion_time_minutes} minutes`,
      new Date(result.submitted_at).toLocaleDateString(),
      result.certificate_issued ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Filter results based on search and filters
  const filteredResults = trainingResults.filter(result => {
    const matchesSearch = 
      result.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.employee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hotelNames[result.hotel_id] || result.hotel_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHotel = selectedHotel === 'all' || result.hotel_id === selectedHotel;
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'passed' && result.passed) ||
      (statusFilter === 'failed' && !result.passed);
    
    const matchesDate = dateFilter === 'all' || (() => {
      const resultDate = new Date(result.submitted_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return resultDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return resultDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return resultDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesHotel && matchesStatus && matchesDate;
  });

  // Calculate statistics
  const stats = {
    totalCompleted: trainingResults.length,
    passRate: trainingResults.length > 0 ? (trainingResults.filter(r => r.passed).length / trainingResults.length * 100) : 0,
    avgScore: trainingResults.length > 0 ? trainingResults.reduce((sum, r) => sum + r.score, 0) / trainingResults.length : 0,
    avgTime: trainingResults.length > 0 ? trainingResults.reduce((sum, r) => sum + r.completion_time_minutes, 0) / trainingResults.length : 0
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: GraduationCap },
    { id: 'courses', label: 'Course Management', icon: FileText },
    { id: 'invitations', label: 'Send Invitations', icon: Mail },
    { id: 'results', label: 'Training Results', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />
        
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => {}}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => {}}
          isMobile={isMobile}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
                <p className="text-gray-600 mt-1">Manage courses, send invitations, and track training progress</p>
              </div>
              <div className="flex items-center space-x-3">
                {saveMessage && (
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {saveMessage.includes('Error') ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{saveMessage}</span>
                  </div>
                )}
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Results</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
                      <p className="text-sm text-gray-600">Total Completed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.passRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Pass Rate</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.avgScore.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Avg Score</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.avgTime.toFixed(1)}m</p>
                      <p className="text-sm text-gray-600">Avg Time</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Training Activity</h2>
                </div>
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainingResults.slice(0, 5).map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${
                              result.passed ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {result.passed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{result.employee_name}</p>
                              <p className="text-sm text-gray-600">
                                {hotelNames[result.hotel_id] || result.hotel_id} • {result.score}% • 
                                {new Date(result.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              result.passed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {trainingResults.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No training results available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Course Management Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Available Courses</h2>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <GraduationCap className="w-4 h-4" />
                      <span>Add New Course</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {courses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                course.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {course.active ? 'Active' : 'Inactive'}
                              </span>
                              {course.mandatory && (
                                <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-4">{course.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <p className="font-medium">{course.duration_minutes} minutes</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Questions:</span>
                                <p className="font-medium">{course.total_questions}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Pass Score:</span>
                                <p className="font-medium">{course.passing_score}%</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Updated:</span>
                                <p className="font-medium">{new Date(course.updated_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-6">
                            <button
                              onClick={() => window.open(course.course_url, '_blank')}
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Course</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                              <Eye className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Email List Input */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Recipients</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste Email List
                      </label>
                      <textarea
                        value={emailListText}
                        onChange={(e) => handleEmailTextChange(e.target.value)}
                        placeholder="Paste emails here (one per line, comma-separated, or from Excel)&#10;&#10;Example:&#10;john@example.com&#10;sarah@example.com&#10;mike@example.com"
                        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Supports various formats: line-separated, comma-separated, or copy-paste from Excel
                      </p>
                    </div>
                    
                    {parsedEmails.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Parsed Emails ({parsedEmails.length})
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(parsedEmails.join('\n'))}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy List</span>
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                          {parsedEmails.map((email, index) => (
                            <div key={index} className="text-sm text-gray-700 py-1">
                              {email}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Template */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Template</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Selection
                      </label>
                      <select
                        value={selectedCourse.id}
                        onChange={(e) => {
                          const course = courses.find(c => c.id === e.target.value);
                          if (course) setSelectedCourse(course);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={invitationSubject}
                        onChange={(e) => setInvitationSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Message
                      </label>
                      <textarea
                        value={invitationMessage}
                        onChange={(e) => setInvitationMessage(e.target.value)}
                        className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Use [TRAINING_LINK] placeholder for the course URL
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Send</h3>
                    <p className="text-gray-600">
                      {parsedEmails.length} recipients • {selectedCourse.title}
                    </p>
                  </div>
                  
                  <button
                    onClick={sendBulkInvitations}
                    disabled={parsedEmails.length === 0 || isSendingInvites}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingInvites ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending... ({Math.round(sendProgress)}%)</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Invitations</span>
                      </>
                    )}
                  </button>
                </div>
                
                {isSendingInvites && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sendProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Training Results Tab */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
                    <select
                      value={selectedHotel}
                      onChange={(e) => setSelectedHotel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Hotels</option>
                      {Object.entries(hotelNames).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Results</option>
                      <option value="passed">Passed Only</option>
                      <option value="failed">Failed Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Training Results ({filteredResults.length})
                    </h2>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hotel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {result.employee_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {result.employee_email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {hotelNames[result.hotel_id] || result.hotel_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.score}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              result.passed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.completion_time_minutes}m
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(result.submitted_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.certificate_issued ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredResults.length === 0 && (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No training results found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Analytics</h2>
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Analytics dashboard coming soon</p>
                  <p className="text-sm">Charts and detailed analytics will be available here</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
