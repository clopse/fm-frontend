import React, { useState } from 'react';

// TypeScript interfaces
interface Hotel {
  id: string;
  name: string;
  address: string;
  details: {
    sqm: string;
    rooms: string;
    floors: string;
  };
  manager: {
    name: string;
    phone: string;
    email: string;
  };
}

interface ComplianceDocument {
  task_id: string;
  filename: string;
  fileUrl: string;
  report_date: string;
  uploaded_at: string;
  uploaded_by: string;
  approved: boolean;
  type: string;
}

interface ReportData {
  hotel: Hotel;
  audit: string;
  compliance: {
    score: any;
    history: any;
    monthlyTasks: any[];
    dueTasks: any;
    taskLabels: Record<string, string>;
    documents: Record<string, any>;
  };
  confirmationNeeded: boolean;
  generatedAt: string;
}

const AuditPrintSystem: React.FC = () => {
  // Hotel configuration
  const hotels = [
    { id: 'hiex', name: 'Holiday Inn Express' },
    { id: 'moxy', name: 'Moxy Cork' },
    { id: 'hida', name: 'Holiday Inn Dublin Airport' },
    { id: 'hbhdcc', name: 'Hampton Dublin' },
    { id: 'hbhe', name: 'Hampton Ealing' },
    { id: 'sera', name: 'Seraphine Kensington' },
    { id: 'marina', name: 'Waterford Marina' },
    { id: 'belfast', name: 'Hamilton Dock' },
    { id: 'hiltonth', name: 'Telephone House' },
  ];

  const hotelNames = Object.fromEntries(hotels.map(h => [h.id, h.name]));

  // State
  const [currentStep, setCurrentStep] = useState('setup');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedAudit, setSelectedAudit] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<string | null>(null);

  // API integration functions
  const fetchComprehensiveAuditData = async (hotelId: string, auditType: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audit-report/${hotelId}?audit_type=${encodeURIComponent(auditType)}`);
      if (!response.ok) throw new Error('Failed to fetch audit data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching comprehensive audit data:', error);
      throw error;
    }
  };

  // Helper functions for data processing
  const buildAddress = (facilities: any) => {
    if (!facilities) return 'Address not available';
    const parts = [
      facilities.address,
      facilities.city,
      facilities.county,
      facilities.postCode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const extractHotelDetails = (facilities: any) => {
    if (!facilities) return { sqm: 'N/A', rooms: 'N/A', floors: 'N/A' };
    
    // Extract from structural data if available
    const structural = facilities.structural || {};
    return {
      sqm: structural.totalArea || 'N/A',
      rooms: structural.totalRooms || 'N/A',
      floors: structural.floors || 'N/A'
    };
  };

  const checkIncompleteFrequentTasks = (monthlyTasks: any[], currentDate: number) => {
    if (!monthlyTasks) return false;
    
    // Check for daily and weekly tasks that might be incomplete
    return monthlyTasks.some(task => {
      const frequency = task.frequency?.toLowerCase();
      if (frequency === 'daily' || frequency === 'weekly') {
        return !task.is_confirmed_this_month;
      }
      return false;
    });
  };

  // Helper function to organize documents by category and filter by audit type
  const organizeDocumentsByCategory = (documents: any[], auditType: string, taskLabels: Record<string, string>) => {
    if (!documents || !taskLabels) return {};

    const auditKeywords: Record<string, string[]> = {
      'Fire Compliance': ['fire', 'smoke', 'alarm', 'extinguisher', 'evacuation', 'emergency', 'door'],
      'Food Hygiene': ['food', 'kitchen', 'hygiene', 'haccp', 'temperature', 'pest'],
      'Health & Safety': ['safety', 'health', 'risk', 'assessment', 'accident', 'first', 'aid'],
      'Environmental': ['waste', 'recycling', 'energy', 'environmental', 'legionella', 'water'],
      'Financial': ['financial', 'audit', 'accounting', 'budget', 'revenue', 'insurance']
    };

    const keywords = auditKeywords[auditType] || [];
    const organized: Record<string, any> = {};

    // Group documents by task category
    documents.forEach(doc => {
      const taskLabel = taskLabels[doc.task_id] || doc.task_id;
      
      // Check if this document belongs to the selected audit type
      const isRelevant = keywords.some(keyword => 
        taskLabel.toLowerCase().includes(keyword) || 
        doc.filename?.toLowerCase().includes(keyword)
      );

      if (isRelevant) {
        if (!organized[doc.task_id]) {
          organized[doc.task_id] = {
            taskLabel: taskLabel,
            documents: []
          };
        }
        organized[doc.task_id].documents.push(doc);
      }
    });

    // Sort documents within each category by date (newest first)
    Object.keys(organized).forEach(taskId => {
      organized[taskId].documents.sort((a: any, b: any) => 
        new Date(b.report_date || b.uploaded_at).getTime() - new Date(a.report_date || a.uploaded_at).getTime()
      );
    });

    return organized;
  };

  const auditTypes = [
    { value: 'Fire Compliance', label: 'Fire Compliance', icon: '🔥' },
    { value: 'Food Hygiene', label: 'Food Hygiene', icon: '🍽️' },
    { value: 'Health & Safety', label: 'Health & Safety', icon: '🏥' },
    { value: 'Environmental', label: 'Environmental', icon: '🌱' },
    { value: 'Financial', label: 'Financial', icon: '💰' }
  ];

  const generateReport = async () => {
    if (!selectedHotel || !selectedAudit) return;
    
    setIsGenerating(true);
    try {
      // Fetch comprehensive audit data from new endpoint
      const auditData = await fetchComprehensiveAuditData(selectedHotel, selectedAudit);
      
      // Check for missing daily/weekly confirmations
      const today = new Date();
      const currentDate = today.getDate();
      const hasIncompleteFrequentTasks = checkIncompleteFrequentTasks(auditData.compliance.monthlyTasks, currentDate);
      
      if (hasIncompleteFrequentTasks && !confirmationStatus) {
        setShowConfirmation(true);
        setIsGenerating(false);
        return;
      }

      // Use the comprehensive data from the new endpoint
      setReportData({
        hotel: auditData.hotel,
        audit: selectedAudit,
        compliance: auditData.compliance,
        confirmationNeeded: hasIncompleteFrequentTasks && confirmationStatus !== 'yes',
        generatedAt: auditData.generatedAt
      });
      
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Component for displaying monthly checklist status
  const MonthlyChecklistDisplay: React.FC<{ tasks: any[]; auditType: string; needsAsterisk: boolean }> = ({ tasks, auditType, needsAsterisk }) => {
    if (!tasks || tasks.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
          No monthly checklist data available
        </div>
      );
    }

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Monthly Confirmations - {currentMonth}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <div key={task.task_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">
                {task.label || task.task_id}
                {needsAsterisk && !task.is_confirmed_this_month && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                task.is_confirmed_this_month 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {task.is_confirmed_this_month ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Component for document category sections
  const DocumentCategorySection: React.FC<{ taskId: string; category: any; needsAsterisk: boolean }> = ({ taskId, category, needsAsterisk }) => {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          {category.taskLabel}
          {needsAsterisk && <span className="text-red-500 ml-1">*</span>}
        </h4>
        
        {category.documents.length > 0 ? (
          <div className="space-y-4">
            {category.documents.map((doc: any, index: number) => (
              <DocumentItem key={index} document={doc} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
            No documents available for this category
          </div>
        )}
      </div>
    );
  };

  // Component for individual document items
  const DocumentItem: React.FC<{ document: any }> = ({ document }) => {
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Date not available';
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const getStatusColor = (approved: boolean) => {
      return approved ? 'text-green-600' : 'text-yellow-600';
    };

    const getStatusText = (approved: boolean) => {
      return approved ? 'Approved' : 'Pending Approval';
    };

    return (
      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-white">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-blue-600">📄</span>
            <div>
              <p className="font-medium text-gray-800">{document.filename || 'Document'}</p>
              <p className="text-sm text-gray-600">
                Report Date: {formatDate(document.report_date)}
                {document.uploaded_at && (
                  <span className="ml-3">
                    Uploaded: {formatDate(document.uploaded_at)}
                  </span>
                )}
              </p>
              {document.uploaded_by && (
                <p className="text-xs text-gray-500">
                  Uploaded by: {document.uploaded_by}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${getStatusColor(document.approved)}`}>
            {getStatusText(document.approved)}
          </span>
          {document.fileUrl && (
            <div className="mt-1">
              <a 
                href={document.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View Document
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Confirmation Dialog Component
  const ConfirmationDialog: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Daily/Weekly Task Confirmation</h3>
        <p className="text-gray-600 mb-6">
          This audit includes daily or weekly tasks. Have all required tasks been completed 
          from the 1st of {new Date().toLocaleString('default', { month: 'long' })} until today?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setConfirmationStatus('yes');
              setShowConfirmation(false);
              generateReport();
            }}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Yes, all completed
          </button>
          <button
            onClick={() => {
              setConfirmationStatus('unknown');
              setShowConfirmation(false);
              generateReport();
            }}
            className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            I don't know
          </button>
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (currentStep === 'preview' && reportData) {
    return (
      <>
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              .print-page { 
                page-break-after: always;
                width: 210mm;
                min-height: 297mm;
                box-sizing: border-box;
                padding: 10mm;
                margin: 0;
              }
              .no-print { display: none; }
              body { 
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              .print-content {
                font-size: 12px;
                line-height: 1.4;
              }
            }
            @media screen {
              .print-page {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto 20px auto;
                padding: 15mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                background: white;
              }
            }
          `}
        </style>
        
        <div className="no-print fixed top-4 right-4 z-50 space-x-2">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print Report
          </button>
          <button 
            onClick={() => setCurrentStep('setup')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>

        {/* Cover Page */}
        <div className="print-page min-h-screen bg-blue-900 text-white flex flex-col justify-center items-center relative">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(/${reportData.hotel.id}bg.png)` }}
          />
          <div className="relative z-10 text-center space-y-6">
            {/* Hotel Logo */}
            <div className="mb-6">
              <img 
                src={`/${reportData.hotel.id}logo.png`} 
                alt={`${reportData.hotel.name} Logo`}
                className="h-16 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-4xl font-bold">{reportData.audit} Audit Report</h1>
            <h2 className="text-2xl">{reportData.hotel.name}</h2>
            
            <div className="text-lg space-y-2 mt-8">
              <p><span className="font-semibold">Report Date:</span> {new Date(reportData.generatedAt).toLocaleDateString()}</p>
              <p><span className="font-semibold">Generated by:</span> JMK Facilities Management</p>
            </div>
          </div>
        </div>

        {/* Hotel Details Page */}
        <div className="print-page p-8 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Hotel Information</h2>
          
          {/* Hotel Logo */}
          <div className="mb-6">
            <img 
              src={`/${reportData.hotel.id}logo.png`} 
              alt={`${reportData.hotel.name} Logo`}
              className="h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Hotel Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Property Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Address:</span> {reportData.hotel.address}</p>
                <p><span className="font-medium">Area:</span> {reportData.hotel.details.sqm} sqm</p>
                <p><span className="font-medium">Rooms:</span> {reportData.hotel.details.rooms}</p>
                <p><span className="font-medium">Floors:</span> {reportData.hotel.details.floors}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Manager Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {reportData.hotel.manager.name}</p>
                <p><span className="font-medium">Phone:</span> {reportData.hotel.manager.phone}</p>
                <p><span className="font-medium">Email:</span> {reportData.hotel.manager.email}</p>
              </div>
            </div>
          </div>

          {/* Compliance Summary with real data */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Compliance Overview</h3>
            {reportData.compliance.score ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.compliance.score.percent}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.compliance.score.score}
                  </div>
                  <div className="text-sm text-gray-600">Points Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-700">
                    {reportData.compliance.score.max_score}
                  </div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Compliance data not available</p>
            )}
            
            {reportData.confirmationNeeded && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm text-yellow-800">
                  * Some daily/weekly tasks may be incomplete this month
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main content pages with documents */}
        <div className="bg-white" style={{
          backgroundImage: `url(/${reportData.hotel.id}bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div className="p-8 bg-white bg-opacity-95">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{reportData.audit} Audit Report</h2>

            
