'use client';

import { useState, useEffect } from 'react';
import { Users, Settings, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  hotel: string;
  status: 'Active' | 'Inactive' | 'Pending';
  lastLogin: string;
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

interface UserOverviewProps {
  onManageAllUsers?: () => void;
}

export default function UserOverview({ onManageAllUsers }: UserOverviewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with real API calls
  const mockUsers: User[] = [
    { 
      id: 1, 
      name: 'Sarah Johnson', 
      email: 'sarah@jmkhotels.ie', 
      role: 'Hotel Manager', 
      hotel: 'Holiday Inn Express', 
      status: 'Active', 
      lastLogin: '2 hours ago',
      createdAt: '2024-01-15'
    },
    { 
      id: 2, 
      name: 'Mike Chen', 
      email: 'mike@jmkhotels.ie', 
      role: 'Maintenance Lead', 
      hotel: 'Hampton Inn', 
      status: 'Active', 
      lastLogin: '1 day ago',
      createdAt: '2024-01-10'
    },
    { 
      id: 3, 
      name: 'David Hurley', 
      email: 'david@jmkhotels.ie', 
      role: 'Operations Manager', 
      hotel: 'All Hotels', 
      status: 'Active', 
      lastLogin: '30 min ago',
      createdAt: '2023-12-20'
    }
  ];

  const mockStats: UserStats = {
    total: 47,
    active: 43,
    pending: 3,
    inactive: 1
  };

  useEffect(() => {
    // Simulate API call
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Replace with: const response = await fetch('/api/users/overview');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        setUsers(mockUsers);
        setStats(mockStats);
      } catch (err) {
        setError('Failed to load user data');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error Loading Users</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">User Overview</h2>
            <p className="text-sm text-gray-500">{stats.total} total users across all hotels</p>
          </div>
        </div>
        <button 
          onClick={onManageAllUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Manage All Users</span>
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                <p className="text-sm text-green-700">Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                <p className="text-sm text-yellow-700">Pending Setup</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
                <p className="text-sm text-red-700">Inactive Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent User Activity */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Recent User Activity</h3>
          {users.slice(0, 3).map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
            onClick={onManageAllUsers}
            className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            View all {stats.total} users →
          </button>
        </div>
      </div>
    </div>
  );
}
