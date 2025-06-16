import React, { useState, useEffect } from 'react';
import { Printer, FileText, CheckCircle, AlertTriangle, Calendar, Download } from 'lucide-react';
import { hotels } from '@/lib/hotels';

interface ComplianceTask {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  type: 'upload' | 'confirmation';
  needs_report: string;
  mandatory: boolean;
  points: number;
  audit: string;
  subtasks?: Array<{
    label: string;
    points: number;
  }>;
}

interface AuditData {
  hotel: {
    id: string;
    name: string;
    address: string;
    manager: { name: string; phone: string; email: string };
    details: { sqm: string; rooms: string; floors: string };
  };
  compliance: {
    score: any;
    documents: Record<string, any>;
    monthlyTasks: any[];
    taskLabels: Record<string, string>;
  };
  auditType: string;
  generatedAt: string;
}

const ProfessionalAuditPDF = () => {
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedAudit, setSelectedAudit] = useState('');
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTask[]>([]);

  // Load compliance tasks on component mount
  useEffect(() => {
    loadComplianceTasks();
  }, []);

  const loadComplianceTasks = async () => {
    try {
      const response = await fetch('/compliance.json');
      const data = await response.json();
      
      // Flatten all tasks from all sections
      const allTasks: ComplianceTask[] = [];
      data.forEach((section: any) => {
        section.tasks.forEach((task: ComplianceTask) => {
          allTasks.push(task);
        });
      });
      
      setComplianceTasks(allTasks);
    } catch (error) {
      console.error('Error loading compliance tasks:', error);
    }
  };

  const auditTypes = [
    { value: 'fire', label: 'Fire Safety Compliance', icon: '🔥' },
    { value: 'electrical', label: 'Electrical Safety', icon: '⚡' },
    { value: 'gas', label: 'Gas Safety', icon: '🔥' },
    { value: 'legionella', label: 'Legionella/Water Hygiene', icon: '💧' },
    { value: 'fog', label: 'FOG Management', icon: '🍽️' },
    { value: 'lift', label: 'Lifts & Equipment', icon: '🛗' },
    { value: 'health_safety', label: 'Health & Safety', icon: '🏥' }
  ];

  const getTasksForAudit = (auditType: string): ComplianceTask[] => {
    return complianceTasks.filter(task => task.audit === auditType);
  };

  const getFrequencyBoxes = (frequency: string) => {
    const year = new Date().getFullYear();
    
    switch (frequency.toLowerCase()) {
      case 'daily':
        return { total: 365, label: 'Daily Confirmations', period: `${year}` };
      case 'weekly':
        return { total: 52, label: 'Weekly Confirmations', period: `${year}` };
      case 'monthly':
        return { total: 12, label: 'Monthly Confirmations', period: `${year}` };
      case 'quarterly':
        return { total: 4, label: 'Quarterly Confirmations', period: `${year}` };
      case 'twiceannually':
        return { total: 2, label: 'Bi-Annual Confirmations', period: `${year}` };
      case 'annually':
        return { total: 1, label: 'Annual Confirmation', period: `${year}` };
      default:
        return { total: 12, label: 'Confirmations', period: `${year}` };
    }
  };

  const fetchAuditData = async () => {
    if (!selectedHotel || !selectedAudit) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/audit-report/${selectedHotel}?audit_type=${selectedAudit}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch audit data');
      
      const data = await response.json();
      setAuditData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      alert('Failed to load audit data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentAuditType = auditTypes.find(a => a.value === selectedAudit);
  const auditTasks = getTasksForAudit(selectedAudit);

  // Render confirmation grid for daily/weekly/monthly tasks
  const ConfirmationGrid: React.FC<{ task: ComplianceTask }> = ({ task }) => {
    const { total, label, period } = getFrequencyBoxes(task.frequency);
    
    // Create grid layout based on frequency
    const getGridLayout = () => {
      if (task.frequency.toLowerCase() === 'daily') {
        // 365 boxes in a calendar-like grid
        return { cols: 31, rows: 12 }; // Roughly monthly layout
      } else if (task.frequency.toLowerCase() === 'weekly') {
        // 52 boxes in 4 rows of 13
        return { cols: 13, rows: 4 };
      } else if (task.frequency.toLowerCase() === 'monthly') {
        // 12 boxes in a single row
        return { cols: 12, rows: 1 };
      } else {
        // Default grid
        return { cols: Math.ceil(Math.sqrt(total)), rows: Math.ceil(total / Math.ceil(Math.sqrt(total))) };
      }
    };

    const { cols, rows } = getGridLayout();

    return (
      <div className="mb-8">
        <h4 className="font-semibold text-lg mb-4">{label} - {period}</h4>
        <div 
          className="grid gap-1 mb-4"
          style={{ 
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: '100%'
          }}
        >
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className="aspect-square border border-gray-300 bg-white flex items-center justify-center text-xs relative group"
              style={{ minWidth: '20px', minHeight: '20px' }}
            >
              <span className="text-gray-400">{i + 1}</span>
              {/* This would be populated with actual data later */}
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-3 rounded text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <strong>Completed:</strong> <span className="text-green-600">0/{total}</span>
            </div>
            <div>
              <strong>Pending:</strong> <span className="text-orange-600">{total}</span>
            </div>
            <div>
              <strong>Overdue:</strong> <span className="text-red-600">0</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-600">
          <p><strong>Signed confirmations:</strong> Each box should be initialed and dated when task is completed.</p>
          <p><strong>Points:</strong> {task.points} points per completion | <strong>Mandatory:</strong> {task.mandatory ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  };

  // Render document section for upload tasks
  const DocumentSection: React.FC<{ task: ComplianceTask }> = ({ task }) => {
    return (
      <div className="mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <h4 className="font-semibold text-lg mb-2">{task.label}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Frequency:</strong> {task.frequency}<br/>
              <strong>Category:</strong> {task.category}<br/>
              <strong>Points:</strong> {task.points}
            </div>
            <div>
              <strong>Mandatory:</strong> {task.mandatory ? 'Yes' : 'No'}<br/>
              <strong>Report Required:</strong> {task.needs_report}<br/>
              <strong>Type:</strong> Document Upload
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded">
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <h5 className="font-medium">Uploaded Documents</h5>
          </div>
          <div className="p-4">
            {/* This will be populated with actual documents from the API */}
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No documents found for this task</p>
              <p className="text-xs mt-1">Documents will be loaded from your compliance system</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showPreview && auditData) {
    return (
      <>
        <style>
          {`
            @page {
              size: A4;
              margin: 15mm;
            }
            
            @media print {
              .no-print { display: none !important; }
              .print-page { 
                page-break-after: always;
                padding: 0;
                margin: 0;
                width: 100%;
                min-height: 267mm;
                box-sizing: border-box;
              }
              .print-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 10pt;
                line-height: 1.3;
                color: #000;
              }
              .print-header {
                border-bottom: 2px solid #1e40af;
                padding-bottom: 8mm;
                margin-bottom: 6mm;
              }
              .toc-entry {
                display: flex;
                justify-content: space-between;
                padding: 2mm 0;
                border-bottom: 1px dotted #ccc;
              }
              .task-section {
                page-break-before: always;
              }
            }
            
            @media screen {
              .print-page {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto 20mm auto;
                padding: 15mm;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }
          `}
        </style>

        <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>
          <button 
            onClick={() => setShowPreview(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back
          </button>
        </div>

        {/* Cover Page */}
        <div className="print-page print-content">
          <div className="text-center">
            <div className="mb-8">
              <img 
                src={`/${auditData.hotel.id}logo.png`}
                alt={`${auditData.hotel.name} Logo`}
                className="h-20 mx-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-4xl font-bold mb-4 text-blue-900">
              {currentAuditType?.icon} {currentAuditType?.label}
            </h1>
            
            <h2 className="text-2xl mb-8 text-gray-700">Compliance Audit Report</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">{auditData.hotel.name}</h3>
              <div className="text-left space-y-2">
                <p><strong>Address:</strong> {auditData.hotel.address}</p>
                <p><strong>Manager:</strong> {auditData.hotel.manager.name}</p>
                <p><strong>Contact:</strong> {auditData.hotel.manager.phone}</p>
                <p><strong>Email:</strong> {auditData.hotel.manager.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded">
                <strong>Report Generated:</strong><br />
                {new Date(auditData.generatedAt).toLocaleDateString('en-GB')}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <strong>Generated By:</strong><br />
                JMK Facilities Management
              </div>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="print-page print-content">
          <div className="print-header">
            <h2 className="text-2xl font-bold text-blue-900">Table of Contents</h2>
          </div>

          <div className="space-y-1">
            <div className="toc-entry">
              <span className="font-medium">1. Executive Summary</span>
              <span>3</span>
            </div>
            <div className="toc-entry">
              <span className="font-medium">2. Compliance Overview</span>
              <span>4</span>
            </div>
            
            {auditTasks.map((task, index) => (
              <div key={task.task_id} className="toc-entry">
                <span>3.{index + 1} {task.label}</span>
                <span>{5 + index}</span>
              </div>
            ))}
            
            <div className="toc-entry">
              <span className="font-medium">4. Summary & Recommendations</span>
              <span>{5 + auditTasks.length}</span>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Legend:</h3>
            <div className="space-y-1">
              <p>📄 = Document Upload Required</p>
              <p>✅ = Daily/Weekly/Monthly Confirmation</p>
              <p>🔴 = Mandatory Task</p>
              <p>🟡 = Recommended Task</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="print-page print-content">
          <div className="print-header">
            <h2 className="text-2xl font-bold text-blue-900">1. Executive Summary</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="font-semibold mb-2">Audit Overview</h3>
              <p>
                This report covers {auditTasks.length} compliance tasks for {currentAuditType?.label.toLowerCase()} 
                at {auditData.hotel.name}. The audit includes both document requirements and ongoing 
                confirmation tasks to ensure regulatory compliance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Document Upload Tasks</h4>
                <div className="space-y-2">
                  {auditTasks.filter(t => t.type === 'upload').map(task => (
                    <div key={task.task_id} className="flex items-center gap-2 text-sm">
                      <span className={task.mandatory ? 'text-red-600' : 'text-yellow-600'}>
                        {task.mandatory ? '🔴' : '🟡'}
                      </span>
                      <span>{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Confirmation Tasks</h4>
                <div className="space-y-2">
                  {auditTasks.filter(t => t.type === 'confirmation').map(task => (
                    <div key={task.task_id} className="flex items-center gap-2 text-sm">
                      <span className={task.mandatory ? 'text-red-600' : 'text-yellow-600'}>
                        {task.mandatory ? '🔴' : '🟡'}
                      </span>
                      <span>{task.label} ({task.frequency})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {auditData.compliance.score && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {auditData.compliance.score.percent}%
                  </div>
                  <div className="text-sm text-green-700">Overall Score</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {auditData.compliance.score.score}
                  </div>
                  <div className="text-sm text-blue-700">Points Achieved</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {auditData.compliance.score.max_score}
                  </div>
                  <div className="text-sm text-gray-700">Total Possible</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="print-page print-content">
          <div className="print-header">
            <h2 className="text-2xl font-bold text-blue-900">2. Compliance Overview</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Task Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{auditTasks.length}</div>
                  <div>Total Tasks</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
                  <div className="text-xl font-bold text-red-600">
                    {auditTasks.filter(t => t.mandatory).length}
                  </div>
                  <div>Mandatory</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <div className="text-xl font-bold text-green-600">
                    {auditTasks.filter(t => t.type === 'upload').length}
                  </div>
                  <div>Document Uploads</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                  <div className="text-xl font-bold text-orange-600">
                    {auditTasks.filter(t => t.type === 'confirmation').length}
                  </div>
                  <div>Confirmations</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Frequency Breakdown</h3>
              <div className="space-y-2">
                {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'].map(freq => {
                  const count = auditTasks.filter(t => 
                    t.frequency.toLowerCase().includes(freq.toLowerCase())
                  ).length;
                  if (count === 0) return null;
                  
                  return (
                    <div key={freq} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span>{freq} Tasks</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Individual Task Pages */}
        {auditTasks.map((task, index) => (
          <div key={task.task_id} className="print-page print-content task-section">
            <div className="print-header">
              <h2 className="text-xl font-bold text-blue-900">
                3.{index + 1} {task.label}
              </h2>
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className={`px-2 py-1 rounded text-white ${task.mandatory ? 'bg-red-500' : 'bg-yellow-500'}`}>
                  {task.mandatory ? 'MANDATORY' : 'RECOMMENDED'}
                </span>
                <span className="text-gray-600">Frequency: {task.frequency}</span>
                <span className="text-gray-600">Points: {task.points}</span>
              </div>
            </div>

            {task.type === 'confirmation' ? (
              <ConfirmationGrid task={task} />
            ) : (
              <DocumentSection task={task} />
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Subtasks</h4>
                <div className="grid grid-cols-2 gap-4">
                  {task.subtasks.map((subtask, subIndex) => (
                    <div key={subIndex} className="bg-gray-50 p-3 rounded border">
                      <div className="font-medium">{subtask.label}</div>
                      <div className="text-sm text-gray-600">{subtask.points} points</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Summary Page */}
        <div className="print-page print-content">
          <div className="print-header">
            <h2 className="text-2xl font-bold text-blue-900">4. Summary & Recommendations</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">Compliance Status</h3>
              <p className="text-green-700">
                All {auditTasks.length} {currentAuditType?.label.toLowerCase()} compliance tasks have been 
                identified and structured for ongoing monitoring and documentation.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Next Steps</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Ensure all mandatory document uploads are completed within required timeframes</li>
                <li>Implement daily/weekly/monthly confirmation logging procedures</li>
                <li>Assign responsibility for each task to specific team members</li>
                <li>Schedule regular reviews of this compliance framework</li>
              </ul>
            </div>

            <div className="text-xs text-gray-600 mt-8">
              <p><strong>Document Generated:</strong> {new Date().toLocaleDateString('en-GB')} by JMK Facilities Management System</p>
              <p><strong>Valid For:</strong> {currentAuditType?.label} compliance monitoring at {auditData.hotel.name}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Professional Compliance Audit PDF</h1>
        <p className="text-gray-600">Generate comprehensive audit reports with task grids and document tracking</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Hotel
            </label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a hotel...</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audit Type
            </label>
            <select
              value={selectedAudit}
              onChange={(e) => setSelectedAudit(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose audit type...</option>
              {auditTypes.map(audit => (
                <option key={audit.value} value={audit.value}>
                  {audit.icon} {audit.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedAudit && auditTasks.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Preview: {currentAuditType?.label} Tasks</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Total Tasks:</strong> {auditTasks.length}</p>
              <p><strong>Document Uploads:</strong> {auditTasks.filter(t => t.type === 'upload').length}</p>
              <p><strong>Confirmations:</strong> {auditTasks.filter(t => t.type === 'confirmation').length}</p>
              <p><strong>Mandatory:</strong> {auditTasks.filter(t => t.mandatory).length}</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchAuditData}
            disabled={!selectedHotel || !selectedAudit || isLoading}
            className={`px-6 py-3 rounded-lg font-medium ${
              !selectedHotel || !selectedAudit || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Generating Report...
              </span>
            ) : (
              'Generate Professional PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAuditPDF;
