'use client';

import { UserPlus, Eye, Edit, Mail, Shield, Trash2, X, Plus, Check, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User, UserCreate, UserUpdate } from '../types/user';
import { userService } from '../services/userService';
import { hotels } from '../lib/hotels';

interface InlineUserManagementProps {
  className?: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState<UserCreate>({
    name: '',
    email: '',
    role: '',
    hotel: '',
    password: '',
  });
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true); // Add this back
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Add success feedback

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
    setSuccessMessage(null);

    if (selectedHotels.length === 0) {
      setError('Please select at least one hotel');
      setLoading(false);
      return;
    }

    try {
      const allHotelNames = hotels.map(h => h.name);
      const hotelAccess = selectedHotels.length === allHotelNames.length 
        ? 'All Hotels' 
        : selectedHotels.join(', ');

      const userData = {
        ...formData,
        hotel: hotelAccess
      };

      // FIXED: Use userService with email handling
      const result = await userService.createUser(userData, sendWelcomeEmail);
      
      // Show success message with email status
      if (sendWelcomeEmail) {
        if (result.emailSent) {
          setSuccessMessage('User created successfully and welcome email sent!');
        } else if (result.emailError) {
          setSuccessMessage(`User created successfully, but email failed: ${result.emailError}`);
        }
      } else {
        setSuccessMessage('User created successfully!');
      }

      // Brief delay to show success message, then close
      setTimeout(() => {
        onUserAdded();
        onClose();
        setFormData({
          name: '',
          email: '',
          role: '',
          hotel: '',
          password: '',
        });
        setSelectedHotels([]);
        setSendWelcomeEmail(true);
        setSuccessMessage(null);
      }, 1500);
      
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

        {/* ADDED: Success message display */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {successMessage}
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

          {/* ADDED BACK: Send Welcome Email Checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Send welcome email</span>
                <p className="text-xs text-gray-600 mt-1">
                  Send an email to the new user with their login credentials and welcome information.
                  The user will still be created even if the email fails to send.
                </p>
              </div>
            </label>
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

export default function InlineUserManagement({ className = '' }: InlineUserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null);

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
    fetchUsers();
  }, [searchTerm, roleFilter, hotelFilter]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await userService.deleteUser(userId);
      fetchUsers();
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
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  // FIXED: Use userService for sending emails to existing users
  const handleSendWelcomeEmail = async (userId: string) => {
    setSendingEmailTo(userId);
    
    try {
      await userService.sendWelcomeEmail(userId);
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      alert('Failed to send welcome email: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSendingEmailTo(null);
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

  const formatHotelAccess = (hotelString: string) => {
    if (hotelString === 'All Hotels') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          All Hotels
        </span>
      );
    }
    
    const hotelList = hotelString.split(', ');
    if (hotelList.length === 1) {
      return <span className="text-sm text-gray-900">{hotelList[0]}</span>;
    }
    
    return (
      <div className="space-y-1">
        <span className="text-sm text-gray-900">{hotelList[0]}</span>
        {hotelList.length > 1 && (
          <div className="text-xs text-gray-500">
            +{hotelList.length - 1} more
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Hotel Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
              <select 
                value={hotelFilter}
                onChange={(e) => setHotelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Hotels</option>
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.name}>{hotel.name}</option>
                ))}
                <option value="All Hotels">All Hotels</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setHotelFilter('');
                }}
                className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel Access</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {formatHotelAccess(user.hotel)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastLogin(user.last_login)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors" 
                            title="View Details"
                            onClick={() => alert('View details functionality coming soon')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-green-600 hover:text-green-800 transition-colors" 
                            title="Edit User"
                            onClick={() => alert('Edit functionality coming soon')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-gray-600 hover:text-gray-800 transition-colors" 
                            title="Send Email"
                            onClick={() => window.open(`mailto:${user.email}`)}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors" 
                            title="Reset Password"
                            onClick={() => handleResetPassword(user.id)}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          {user.status === 'Active' ? (
                            <button 
                              className="p-1 text-red-600 hover:text-red-800 transition-colors" 
                              title="Deactivate"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              className="p-1 text-green-600 hover:text-green-800 transition-colors" 
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
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">
                    {searchTerm || roleFilter || hotelFilter
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first user.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={fetchUsers}
      />
    </>
  );
}
