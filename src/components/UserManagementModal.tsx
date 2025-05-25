'use client';

import { UserPlus, Eye, Edit, Mail, Shield, Trash2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  hotel: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockUsers: User[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@jmkhotels.ie', role: 'Hotel Manager', hotel: 'Holiday Inn Express', status: 'Active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Mike Chen', email: 'mike@jmkhotels.ie', role: 'Maintenance Lead', hotel: 'Hampton Inn', status: 'Active', lastLogin: '1 day ago' },
  { id: 3, name: 'David Hurley', email: 'david@jmkhotels.ie', role: 'Operations Manager', hotel: 'All Hotels', status: 'Active', lastLogin: '30 min ago' }
];

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Management System</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
  );
}
