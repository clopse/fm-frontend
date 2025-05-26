// FILE: src/components/UserManagementModal.tsx
'use client';

import { UserPlus, Eye, Edit, Mail, Shield, Trash2, X, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User, UserCreate, UserUpdate } from '../types/user';
import { userService } from '../services/userService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

// FILE: src/components/UserManagementModal.tsx
'use client';

import { UserPlus, Eye, Edit, Mail, Shield, Trash2, X, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User, UserCreate, UserUpdate } from '../types/user';
import { userService } from '../services/userService';
import { hotels } from '../lib/hotels';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

// Add User Modal Component
function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState<UserCreate>({
    name: '',
    email: '',
    role: '',
    hotel: '',
    password: '',
  });
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHotelToggle = (hotel: string) => {
    setSelectedHotels(prev => {
      if (prev.includes(hotel)) {
        return prev.filter(h => h !== hotel);
      } else {
        return [...prev, hotel];
      }
    });
  };

  const selectAllHotels = () => {
    const allHotelNames = hotels.map(h => h.name);
    if (selectedHotels.length === allHotelNames.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels([...allHotelNames]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedHotels.length === 0) {
      setError('Please select at least one hotel');
      setLoading(false);
      return;
    }

    try {
      // Convert selected hotels array to string
      const allHotelNames = hotels.map(h => h.name);
      const hotelAccess = selectedHotels.length === allHotelNames.length 
        ? 'All Hotels' 
        : selectedHotels.join(', ');

      const userData = {
        ...formData,
        hotel: hotelAccess
      };

      await userService.createUser(userData);
      onUserAdded();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: '',
        hotel: '',
        password: '',
      });
      setSelectedHotels([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const allHotelNames = hotels.map(h => h.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter role (e.g., Hotel Manager, System Admin, etc.)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Access</label>
            
            {/* Select All Button */}
            <div className="mb-3">
              <button
                type="button"
                onClick={selectAllHotels}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>
                  {selectedHotels.length === allHotelNames.length ? 'Deselect All' : 'Select All Hotels'}
                </span>
              </button>
            </div>

            {/* Hotel Checkboxes */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
              {hotels.map(hotel => (
                <label key={hotel.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedHotels.includes(hotel.name)}
                    onChange={() => handleHotelToggle(hotel.name)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{hotel.name}</span>
                </label>
              ))}
            </div>

            {/* Selected Count */}
            <div className="mt-2 text-xs text-gray-500">
              {selectedHotels.length} of {allHotelNames.length} hotels selected
              {selectedHotels.length > 0 && (
                <div className="mt-1">
                  <strong>Selected:</strong> {selectedHotels.slice(0, 2).join(', ')}
                  {selectedHotels.length > 2 && ` and ${selectedHotels.length - 2} more`}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getUsers({
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        hotel: hotelFilter || undefined,
      });
      setUsers(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, searchTerm, roleFilter, hotelFilter]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await userService.deleteUser(userId);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await userService.resetPassword(userId, newPassword);
      alert('Password reset successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await userService.activateUser(userId);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Format hotel access for display
  const formatHotelAccess = (hotelString: string) => {
    if (hotelString === 'All Hotels') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          All Hotels
        </span>
      );
    }
    
    // Handle comma-separated multiple hotels
    const hotels = hotelString.split(', ');
    if (hotels.length === 1) {
      return <span className="text-sm text-gray-900">{hotels[0]}</span>;
    }
    
    return (
      <div className="space-y-1">
        <span className="text-sm text-gray-900">{hotels[0]}</span>
        {hotels.length > 1 && (
          <div className="text-xs text-gray-500">
            +{hotels.length - 1} more
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">User Management System</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                />
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Roles</option>
                  <option value="Hotel Manager">Hotel Manager</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Maintenance Lead">Maintenance Lead</option>
                  <option value="System Admin">System Admin</option>
                  <option value="Cluster Boss">Cluster Boss</option>
                  <option value="Ireland Boss">Ireland Boss</option>
                  <option value="UK Boss">UK Boss</option>
                </select>
                <select 
                  value={hotelFilter}
                  onChange={(e) => setHotelFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Hotels</option>
                  <option value="Holiday Inn Express">Holiday Inn Express</option>
                  <option value="Moxy Cork">Moxy Cork</option>
                  <option value="Holiday Inn Dublin Airport">Holiday Inn Dublin Airport</option>
                  <option value="Hampton Dublin">Hampton Dublin</option>
                  <option value="Hampton Ealing">Hampton Ealing</option>
                  <option value="Seraphine Kensington">Seraphine Kensington</option>
                  <option value="Waterford Marina">Waterford Marina</option>
                  <option value="Hamilton Dock">Hamilton Dock</option>
                  <option value="Telephone House">Telephone House</option>
                  <option value="All Hotels">All Hotels</option>
                </select>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : (
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
                    {users.map(user => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatHotelAccess(user.hotel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLastLogin(user.last_login)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="p-1 text-blue-600 hover:text-blue-800" 
                              title="View Details"
                              onClick={() => alert('View details functionality coming soon')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-green-600 hover:text-green-800" 
                              title="Edit User"
                              onClick={() => alert('Edit functionality coming soon')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-600 hover:text-gray-800" 
                              title="Send Email"
                              onClick={() => window.open(`mailto:${user.email}`)}
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-yellow-600 hover:text-yellow-800" 
                              title="Reset Password"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            {user.status === 'Active' ? (
                              <button 
                                className="p-1 text-red-600 hover:text-red-800" 
                                title="Deactivate"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                className="p-1 text-green-600 hover:text-green-800" 
                                title="Activate"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    No users found matching your criteria.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {users.length} user{users.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddUserModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={fetchUsers}
      />
    </>
  );
}
