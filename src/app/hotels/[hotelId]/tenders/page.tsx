'use client';
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Mail, 
  Upload, 
  Download,
  MessageSquare,
  Calendar,
  Building2,
  FileText,
  Plus,
  X,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';

// Type definitions
interface Tender {
  id: string;
  title: string;
  description: string;
  location: string;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  status: string;
  quotesReceived: number;
  totalQuotes: number;
  suppliers: string[];
  emailSent: boolean;
  emailDate: string | null;
  budget: number;
  comments: number;
  priority: string;
  category: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  categories: string[];
  totalJobs: number;
  averageRating: number;
  pricePerM2?: number;
  notes: string;
}

interface TenderModalProps {
  tender: Tender;
  onClose: () => void;
}

// Hotel categories for filtering
const HOTEL_CATEGORIES = [
  'Electrical',
  'Plumbing', 
  'Carpets',
  'Painting',
  'Windows',
  'Doors',
  'HVAC',
  'Flooring',
  'Lighting',
  'Security',
  'Fire Safety',
  'Landscaping',
  'Cleaning',
  'Furniture',
  'Kitchen Equipment'
];

export default function TendersPage() {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [showNewTenderModal, setShowNewTenderModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Sample tender data with categories
  const [tenders] = useState<Tender[]>([
    {
      id: 'TND-001',
      title: 'Lobby Tiles Replacement',
      description: 'Replace all lobby tiles with premium marble finish',
      location: 'Ground Floor - Main Lobby',
      createdBy: 'David Hurley',
      createdAt: '2025-01-20',
      dueDate: '2025-02-15',
      status: 'Active',
      quotesReceived: 2,
      totalQuotes: 5,
      suppliers: ['Tile Pro Ltd', 'Premium Floors', 'Stone Masters', 'Elite Tiles', 'Marble Works'],
      emailSent: true,
      emailDate: '2025-01-21',
      budget: 15000,
      comments: 3,
      priority: 'High',
      category: 'Flooring'
    },
    {
      id: 'TND-002',
      title: 'HVAC System Upgrade',
      description: 'Complete HVAC system replacement for floors 1-5',
      location: 'Floors 1-5',
      createdBy: 'Sarah Johnson',
      createdAt: '2025-01-18',
      dueDate: '2025-03-01',
      status: 'Pending',
      quotesReceived: 0,
      totalQuotes: 3,
      suppliers: ['Climate Control Co', 'Air Solutions', 'HVAC Masters'],
      emailSent: false,
      emailDate: null,
      budget: 45000,
      comments: 1,
      priority: 'Medium',
      category: 'HVAC'
    },
    {
      id: 'TND-003',
      title: 'Elevator Modernization',
      description: 'Modernize passenger elevators with new control systems',
      location: 'All Floors - Elevator Shaft A & B',
      createdBy: 'Mike Chen',
      createdAt: '2025-01-15',
      dueDate: '2025-02-28',
      status: 'Closed',
      quotesReceived: 3,
      totalQuotes: 3,
      suppliers: ['Otis Elevators', 'Schindler', 'KONE'],
      emailSent: true,
      emailDate: '2025-01-16',
      budget: 85000,
      comments: 8,
      priority: 'High',
      category: 'Electrical'
    }
  ]);

  // Sample supplier database
  const [suppliers] = useState<Supplier[]>([
    {
      id: 'SUP-001',
      name: 'JJs Carpets',
      email: 'info@jjscarpets.ie',
      phone: '+353-1-234-5678',
      categories: ['Carpets', 'Flooring'],
      totalJobs: 23,
      averageRating: 4.7,
      pricePerM2: 45,
      notes: 'Excellent quality, always on time. Preferred for luxury suites.'
    },
    {
      id: 'SUP-002', 
      name: 'Dublin Electrical Services',
      email: 'quotes@dublinelectric.ie',
      phone: '+353-1-567-8910',
      categories: ['Electrical', 'Lighting'],
      totalJobs: 31,
      averageRating: 4.5,
      notes: 'Reliable for emergency repairs. 24/7 availability.'
    },
    {
      id: 'SUP-003',
      name: 'Premium Plumbing Solutions',
      email: 'service@premiumplumbing.ie', 
      phone: '+353-1-345-6789',
      categories: ['Plumbing', 'HVAC'],
      totalJobs: 18,
      averageRating: 4.8,
      notes: 'High-end work, excellent for guest bathrooms.'
    }
  ]);

  const TenderModal: React.FC<TenderModalProps> = ({ tender, onClose }) => {
    const [activeTab, setActiveTab] = useState('quotes');
    const [newComment, setNewComment] = useState('');
    
    const mockQuotes = [
      {
        id: 1,
        supplier: 'Tile Pro Ltd',
        amount: 12500,
        submittedAt: '2025-01-25',
        status: 'Received',
        documents: ['quote-tilepro.pdf', 'samples-catalog.pdf']
      },
      {
        id: 2,
        supplier: 'Premium Floors',
        amount: 14200,
        submittedAt: '2025-01-26',
        status: 'Received',
        documents: ['premium-quote.pdf']
      },
      {
        id: 3,
        supplier: 'Stone Masters',
        amount: null,
        submittedAt: null,
        status: 'Pending',
        documents: []
      }
    ];

    const mockComments = [
      {
        id: 1,
        author: 'David Hurley',
        content: 'Sent initial quotes to all suppliers. Waiting for responses.',
        timestamp: '2025-01-21 14:30'
      },
      {
        id: 2,
        author: 'Sarah Johnson',
        content: 'Tile Pro and Premium Floors have submitted quotes. Following up with others.',
        timestamp: '2025-01-26 09:15'
      }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{tender.title}</h2>
                <p className="text-sm text-gray-500">{tender.id} • Created by {tender.createdBy}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'quotes', label: 'Quotes', icon: Building2 },
                { id: 'suppliers', label: 'Suppliers', icon: Users },
                { id: 'documents', label: 'Documents', icon: Upload },
                { id: 'comments', label: 'Comments', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Project Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div><span className="font-medium">Description:</span> {tender.description}</div>
                      <div><span className="font-medium">Location:</span> {tender.location}</div>
                      <div><span className="font-medium">Budget:</span> €{tender.budget.toLocaleString()}</div>
                      <div><span className="font-medium">Due Date:</span> {tender.dueDate}</div>
                      <div><span className="font-medium">Priority:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          tender.priority === 'High' ? 'bg-red-100 text-red-800' :
                          tender.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {tender.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Status Overview</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Quotes Progress</span>
                        <span className="font-medium">{tender.quotesReceived}/{tender.totalQuotes}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${(tender.quotesReceived / tender.totalQuotes) * 100}%`}}
                        ></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tender.emailSent ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <span>Email {tender.emailSent ? 'Sent' : 'Pending'}</span>
                        {tender.emailDate && <span className="text-gray-500">({tender.emailDate})</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Quote Submissions</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Manual Quote Entry</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {mockQuotes.map(quote => (
                    <div key={quote.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{quote.supplier}</h4>
                          {quote.amount && (
                            <p className="text-lg font-semibold text-green-600">€{quote.amount.toLocaleString()}</p>
                          )}
                          {quote.submittedAt && (
                            <p className="text-sm text-gray-500">Submitted: {quote.submittedAt}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            quote.status === 'Received' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {quote.status}
                          </span>
                          {quote.documents.length > 0 && (
                            <div className="flex space-x-1">
                              {quote.documents.map((doc, idx) => (
                                <button key={idx} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                  <Download className="w-4 h-4" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'suppliers' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Supplier Management</h3>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Send Email to All</span>
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Supplier</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tender.suppliers.map((supplier, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{supplier}</h4>
                          <p className="text-sm text-gray-500">
                            {mockQuotes.find(q => q.supplier === supplier)?.status || 'Pending Response'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Documents & Uploads</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </button>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                  <p className="text-sm text-gray-500">Supports: PDF, DOC, XLS, Images</p>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
                  <div className="space-y-2">
                    {['project-specs.pdf', 'lobby-photos.zip', 'original-email.pdf'].map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium">{file}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Comments & Activity</h3>
                
                <div className="space-y-4 mb-6">
                  {mockComments.map(comment => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        <span className="text-sm text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex space-x-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSort = (field: keyof Tender) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (tender: Tender) => {
    setSelectedTender(tender);
  };

  const handleActionClick = (e: React.MouseEvent, action: string, tender: Tender) => {
    e.stopPropagation(); // Prevent row click when clicking action buttons
    
    switch (action) {
      case 'view':
        setSelectedTender(tender);
        break;
      case 'email':
        // Handle email action
        console.log('Send email for tender:', tender.id);
        break;
      case 'comments':
        // Handle comments action - could open modal with comments tab
        setSelectedTender(tender);
        // You might want to set a state to open the comments tab specifically
        break;
    }
  };

  const filteredData = tenders.filter(item => {
    const matchesSearch = Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField as keyof Tender];
    const bVal = b[sortField as keyof Tender];
    
    if (sortDirection === 'asc') {
      return String(aVal) > String(bVal) ? 1 : -1;
    } else {
      return String(aVal) < String(bVal) ? 1 : -1;
    }
  });

  const SortIcon: React.FC<{ field: keyof Tender }> = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-gray-600" /> : 
      <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tender Management</h2>
          <button 
            onClick={() => setShowNewTenderModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Tender</span>
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Create, track, and manage all your tender processes with suppliers and quotes.
        </p>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {(selectedCategory || selectedStatus) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {[selectedCategory, selectedStatus].filter(Boolean).length}
                  </span>
                )}
              </button>
              
              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All Categories</option>
                        {HOTEL_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setSelectedStatus('');
                        }}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredData.length} of {tenders.length} tenders
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left">
                <button 
                  onClick={() => handleSort('id')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Tender ID</span>
                  <SortIcon field="id" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button 
                  onClick={() => handleSort('title')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Title</span>
                  <SortIcon field="title" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button 
                  onClick={() => handleSort('createdBy')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Created By</span>
                  <SortIcon field="createdBy" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quotes</span>
              </th>
              <th className="px-6 py-3 text-left">
                <button 
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Status</span>
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button 
                  onClick={() => handleSort('dueDate')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Due Date</span>
                  <SortIcon field="dueDate" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((tender) => (
              <tr 
                key={tender.id} 
                onClick={() => handleRowClick(tender)}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-blue-600">{tender.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tender.title}</div>
                    <div className="text-sm text-gray-500">{tender.location}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tender.createdBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    tender.category === 'HVAC' ? 'bg-blue-100 text-blue-800' :
                    tender.category === 'Electrical' ? 'bg-yellow-100 text-yellow-800' :
                    tender.category === 'Flooring' ? 'bg-green-100 text-green-800' :
                    tender.category === 'Plumbing' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tender.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {tender.quotesReceived}/{tender.totalQuotes}
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${(tender.quotesReceived / tender.totalQuotes) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tender.status)}`}>
                    {tender.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tender.dueDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => handleActionClick(e, 'view', tender)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleActionClick(e, 'email', tender)}
                      className="p-1 text-green-600 hover:text-green-800" 
                      title="Send Email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleActionClick(e, 'comments', tender)}
                      className="p-1 text-gray-600 hover:text-gray-800" 
                      title="Comments"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tender Detail Modal */}
      {selectedTender && (
        <TenderModal 
          tender={selectedTender} 
          onClose={() => setSelectedTender(null)} 
        />
      )}
    </div>
  );
}
