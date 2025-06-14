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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: User | null;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never logged in';
    return formatDate(lastLogin);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                  {user.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Hotel Access Section */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Hotel Access</label>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              {user.hotel === 'All Hotels' ? (
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                  All Hotels
                </span>
              ) : (
                <div className="space-y-2">
                  {user.hotel.split(', ').map((hotel, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-900">{hotel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Account Information</label>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span className="text-gray-900">{formatLastLogin(user.last_login)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="text-gray-900 font-mono text-sm">{user.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<UserUpdate>({
    name: '',
    email: '',
    role: '',
    hotel: '',
  });
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        hotel: user.hotel,
      });

      // Set selected hotels
      if (user.hotel === 'All Hotels') {
        setSelectedHotels(hotels.map(h => h.name));
      } else {
        setSelectedHotels(user.hotel.split(', '));
      }
    }
  }, [user, isOpen]);

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
    if (!user) return;

    setLoading(true);
    setError(null);

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

      await userService.updateUser(user.id, userData);
      onUserUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: '', hotel: '' });
    setSelectedHotels([]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !user) return null;

  const allHotelNames = hotels.map(h => h.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit User</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
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

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [searchTerm, setSearchTerm] = us
