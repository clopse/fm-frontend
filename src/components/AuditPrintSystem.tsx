// app/components/audit/ProfessionalAuditPDF.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Printer, FileText, CheckCircle, AlertTriangle, Calendar, Download, Eye } from 'lucide-react';
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
  section?: string;
  info_popup?: string;
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
    city: string;
    postCode: string;
    phone: string;
    manager: { 
      name: string; 
      phone: string; 
      email: string; 
    };
    details: { 
      sqm: string; 
      rooms: string; 
      floors: string; 
    };
  };
  compliance: {
    score: {
      score: number;
      max_score: number;
      percent: number;
      task_breakdown: Record<string, number>;
    };
    tasks: ComplianceTask[];
    taskLabels: Record<string, string>;
  };
  auditType: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  hasIncompleteData: boolean;
}

const ProfessionalAuditPDF: React.FC = () => {
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewTasks, setPreviewTasks] = useState<ComplianceTask[]>([]);
  const [error, setError] = useState<string>('');

  // Set default dates to previous year for 13-24 months of data
  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const previousYear = currentYear - 1;
    setStartDate(`${previousYear}-01-01`);
    setEndDate(today.toISOString().split('T')[0]); // Today's date
  }, []);

  const auditTypes = [
    { value: 'fire', label: 'Fire Safety Compliance', icon: '🔥' },
    { value: 'electrical', label: 'Electrical Safety', icon: '⚡' },
    { value: 'gas', label: 'Gas Safety', icon: '🔥' },
    { value: 'legionella', label: 'Legionella/Water Hygiene', icon: '💧' },
    { value: 'fog', label: 'FOG Management', icon: '🍽️' },
    { value: 'lift', label: 'Lifts & Equipment', icon: '🛗' },
    { value: 'health_safety', label: 'Health & Safety', icon: '🏥' }
  ];

  // Load preview data when hotel/audit type changes
  useEffect(() => {
    if (selectedHotel && selectedAudit) {
      loadPreviewData();
    } else {
      setPreviewTasks([]);
      setError('');
    }
  }, [selectedHotel, selectedAudit, startDate, endDate]);

  const loadPreviewData = async (): Promise<void> => {
    if (!selectedHotel || !selectedAudit) return;
    
    setError('');
    try {
      const hotelTasksId = `${selectedHotel}tasks`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/audit-report/${hotelTasksId}/preview-data?audit_type=${selectedAudit}&start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        console.warn(`Preview failed: ${response.status} ${response.statusText}`);
        setPreviewTasks([]);
        return;
      }
      
      const data = await response.json();
      setPreviewTasks(data.compliance?.tasks || []);
    } catch (error: any) {
      console.warn('Error loading preview data:', error);
      setPreviewTasks([]);
    }
  };

  const generatePDF = async (): Promise<void> => {
    if (!selectedHotel || !selectedAudit) return;
    
    setIsLoading(true);
    setError('');
    try {
      const hotelTasksId = `${selectedHotel}tasks`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/audit-report/${hotelTasksId}/generate-pdf?audit_type=${selectedAudit}&start_date=${startDate}&end_date=${endDate}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`PDF generation failed: ${response.status} ${response.statusText}`);
        return;
      }
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedHotel}_${selectedAudit}_audit_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.warn('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditData = async (): Promise<void> => {
    if (!selectedHotel || !selectedAudit) return;
    
    setIsLoading(true);
    setError('');
    try {
      const hotelTasksId = `${selectedHotel}tasks`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/audit-report/${hotelTasksId}/preview-data?audit_type=${selectedAudit}&start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        console.warn(`Preview failed: ${response.status} ${response.statusText}`);
        setAuditData(null);
        return;
      }
      
      const data = await response.json();
      
      // Only proceed if we have real data
      if (!data.compliance?.tasks || data.compliance.tasks.length === 0) {
        setAuditData(null);
        return;
      }
      
      // Transform preview data into full audit data structure for display
      const fullAuditData: AuditData = {
        hotel: {
          id: selectedHotel,
          name: data.hotel?.name || 'Unknown Hotel',
          address: data.hotel?.address || '',
          city: data.hotel?.city || '',
          postCode: data.hotel?.postCode || '',
          phone: data.hotel?.phone || '',
          manager: {
            name: data.hotel?.manager?.name || '',
            phone: data.hotel?.manager?.phone || '',
            email: data.hotel?.manager?.email || ''
          },
          details: {
            sqm: data.hotel?.details?.sqm || 'N/A',
            rooms: data.hotel?.details?.rooms || 'N/A',
            floors: data.hotel?.details?.floors || 'N/A'
          }
        },
        compliance: {
          score: data.compliance?.score || { score: 0, max_score: 100, percent: 0, task_breakdown: {} },
          tasks: data.compliance?.tasks || [],
          taskLabels: (data.compliance?.tasks || []).reduce((acc: Record<string, string>, task: ComplianceTask) => {
            acc[task.task_id] = task.label;
            return acc;
          }, {})
        },
        auditType: selectedAudit,
        dateRange: {
          start: startDate,
          end: endDate
        },
        generatedAt: data.generatedAt || new Date().toISOString(),
        hasIncompleteData: data.hasIncompleteData !== false
      };
      
      setAuditData(fullAuditData);
      setShowPreview(true);
    } catch (error: any) {
      console.warn('Error fetching audit data:', error);
      setAuditData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAuditType = auditTypes.find(a => a.value === selectedAudit);
  const today = new Date().toISOString().split('T')[0];

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
      case 'biennially':
        return { total: 1, label: 'Biennial Confirmation', period: `${year}` };
      case 'every5years':
        return { total: 1, label: '5-Year Cycle', period: `${year}` };
      case 'asscheduled':
        return { total: 4, label: 'Scheduled Confirmations', period: `${year}` };
      default:
        return { total: 12, label: 'Confirmations', period: `${year}` };
    }
  };

  // Render confirmation grid for tasks requiring regular confirmations
  const ConfirmationGrid: React.FC<{ task: ComplianceTask }> = ({ task }) => {
    const { total, label, period } = getFrequencyBoxes(task.frequency);
    
    const getGridLayout = () => {
      if (task.frequency.toLowerCase() === 'daily') {
        return { cols: 31, rows: 12 }; // Monthly calendar layout
      } else if (task.frequency.toLowerCase() === 'weekly') {
        return { cols: 13, rows: 4 }; // 4 rows of 13 weeks
      } else if (task.frequency.toLowerCase() === 'monthly') {
        return { cols: 12, rows: 1 }; // 12 months in a row
      } else if (task.frequency.toLowerCase() === 'quarterly') {
        return { cols: 4, rows: 1 }; // 4 quarters
      } else {
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
              className="aspect-square border border-gray-300 bg-white flex items-center justify-center text-xs relative group hover:bg-gray-50"
              style={{ minWidth: '20px', minHeight: '20px' }}
            >
              <span className="text-gray-400">{i + 1}</span>
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
          <p><strong>Instructions:</strong> Each box should be initialed and dated when task is completed.</p>
          <p><strong>Points:</strong> {task.points} points | <strong>Mandatory:</strong> {task.mandatory ? 'Yes' : 'No'}</p>
          {task.info_popup && (
            <p className="mt-2 text-gray-500 italic">{task.info_popup}</p>
          )}
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
          {task.info_popup && (
            <div className="mt-3 p-3 bg-blue-100 rounded text-xs">
              <strong>Details:</strong> {task.info_popup}
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded">
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <h5 className="font-medium">Document Upload Status</h5>
          </div>
          <div className="p-4">
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No documents uploaded for this task</p>
              <p className="text-xs mt-1">Upload status will be populated from compliance system</p>
            </div>
          </div>
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-4">
            <h5 className="font-medium mb-2">Subtasks:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {task.subtasks.map((subtask, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                  <span className="font-medium">{subtask.label}</span>
                  <span className="text-gray-600 ml-2">({subtask.points} pts)</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>
          <button 
            onClick={generatePDF}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isLoading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Download className="w-4 h-4" />
            {isLoading ? 'Generating...' : 'Download PDF'}
          </button>
          <button 
            onClick={() => setShowPreview(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
        </div>

        {/* Cover Page */}
        <div className="print-page print-content">
          <div className="text-center">
            <div className="mb-8">
              <div className="h-20 flex items-center justify-center bg-blue-50 rounded-lg mb-4">
                <span className="text-3xl">{currentAuditType?.icon}</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-blue-900">
              {currentAuditType?.label}
            </h1>
            
            <h2 className="text-2xl mb-8 text-gray-700">Compliance Audit Report</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">{auditData.hotel.name}</h3>
              <div className="text-left space-y-2">
                <p><strong>Address:</strong> {auditData.hotel.address}</p>
                <p><strong>City:</strong> {auditData.hotel.city} {auditData.hotel.postCode}</p>
                <p><strong>Phone:</strong> {auditData.hotel.phone}</p>
                <p><strong>Manager:</strong> {auditData.hotel.manager.name}</p>
                <p><strong>Email:</strong> {auditData.hotel.manager.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded">
                <strong>Audit Period:</strong><br />
                {new Date(auditData.dateRange.start).toLocaleDateString('en-GB')} - {new Date(auditData.dateRange.end).toLocaleDateString('en-GB')}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <strong>Generated:</strong><br />
                {new Date(auditData.generatedAt).toLocaleDateString('en-GB')}
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-block bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {auditData.compliance.score.percent}%
                </div>
                <div className="text-sm text-green-700">Compliance Score</div>
                <div className="text-xs text-gray-600 mt-1">
                  {auditData.compliance.score.score} / {auditData.compliance.score.max_score} points
                </div>
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
            
            {auditData.compliance.tasks.map((task, index) => (
              <div key={task.task_id} className="toc-entry">
                <span>3.{index + 1} {task.label}</span>
                <span>{5 + index}</span>
              </div>
            ))}
            
            <div className="toc-entry">
              <span className="font-medium">4. Summary & Recommendations</span>
              <span>{5 + auditData.compliance.tasks.length}</span>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Legend:</h3>
            <div className="space-y-1">
              <p>📄 = Document Upload Required</p>
              <p>✅ = Confirmation Task</p>
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
                This report covers {auditData.compliance.tasks.length} compliance tasks for {currentAuditType?.label.toLowerCase()} 
                at {auditData.hotel.name}. The audit period spans from {new Date(auditData.dateRange.start).toLocaleDateString('en-GB')} 
                to {new Date(auditData.dateRange.end).toLocaleDateString('en-GB')}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Document Upload Tasks</h4>
                <div className="space-y-2">
                  {auditData.compliance.tasks.filter(t => t.type === 'upload').map(task => (
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
                  {auditData.compliance.tasks.filter(t => t.type === 'confirmation').map(task => (
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

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {auditData.compliance.tasks.length}
                </div>
                <div className="text-sm text-blue-700">Total Tasks</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {auditData.compliance.score.percent}%
                </div>
                <div className="text-sm text-green-700">Compliance</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {auditData.compliance.tasks.filter(t => t.mandatory).length}
                </div>
                <div className="text-sm text-red-700">Mandatory</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {auditData.compliance.score.score}
                </div>
                <div className="text-sm text-orange-700">Points Earned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Task Pages */}
        {auditData.compliance.tasks.map((task, index) => (
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
                {task.section && <span className="text-gray-600">Section: {task.section}</span>}
              </div>
            </div>

            {task.type === 'confirmation' ? (
              <ConfirmationGrid task={task} />
            ) : (
              <DocumentSection task={task} />
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
              <h3 className="font-semibold text-green-800 mb-2">Compliance Framework Established</h3>
              <p className="text-green-700">
                All {auditData.compliance.tasks.length} {currentAuditType?.label.toLowerCase()} compliance tasks have been 
                identified and structured for ongoing monitoring at {auditData.hotel.name}.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Implementation Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Complete all mandatory document uploads within required timeframes</li>
                <li>Establish daily/weekly/monthly confirmation procedures</li>
                <li>Assign specific team members to each compliance task</li>
                <li>Schedule regular reviews of this compliance framework</li>
                <li>Maintain accurate records for regulatory inspections</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Next Actions Required</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                <li>Upload missing mandatory documents</li>
                <li>Begin regular confirmation logging</li>
                <li>Train staff on compliance procedures</li>
                <li>Schedule follow-up audit review</li>
              </ul>
            </div>

            <div className="text-xs text-gray-600 mt-8 border-t pt-4">
              <p><strong>Report Generated:</strong> {new Date(auditData.generatedAt).toLocaleDateString('en-GB')} by JMK Facilities Management System</p>
              <p><strong>Hotel ID:</strong> {auditData.hotel.id} | <strong>Audit Type:</strong> {auditData.auditType}</p>
              <p><strong>Valid For:</strong> {currentAuditType?.label} compliance monitoring at {auditData.hotel.name}</p>
              <p><strong>Data Status:</strong> {auditData.hasIncompleteData ? 'Partial data - some information pending' : 'Complete compliance data'}</p>
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
        <p className="text-gray-600">Generate comprehensive audit reports with real hotel compliance data</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Hotel
            </label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={today}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={today}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {selectedAudit && previewTasks.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Preview: {currentAuditType?.label} Tasks
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
              <div>
                <strong>Total Tasks:</strong> {previewTasks.length}
              </div>
              <div>
                <strong>Documents:</strong> {previewTasks.filter(t => t.type === 'upload').length}
              </div>
              <div>
                <strong>Confirmations:</strong> {previewTasks.filter(t => t.type === 'confirmation').length}
              </div>
              <div>
                <strong>Mandatory:</strong> {previewTasks.filter(t => t.mandatory).length}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Task Sections:</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(previewTasks.map(t => t.section).filter(Boolean))).map(section => (
                  <span key={section} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedAudit && previewTasks.length === 0 && !error && selectedHotel && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="w-5 h-5" />
              <span className="font-medium">No data available for this configuration</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              No {currentAuditType?.label.toLowerCase()} compliance tasks found for the selected hotel and date range.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={fetchAuditData}
            disabled={!selectedHotel || !selectedAudit || isLoading}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 justify-center transition-colors ${
              !selectedHotel || !selectedAudit || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Loading Preview...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Preview Report
              </>
            )}
          </button>

          <button
            onClick={generatePDF}
            disabled={!selectedHotel || !selectedAudit || isLoading}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 justify-center transition-colors ${
              !selectedHotel || !selectedAudit || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>

        {selectedHotel && selectedAudit && !error && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              <strong>API Endpoint:</strong> /api/audit-report/{selectedHotel}tasks/generate-pdf
            </p>
            <p>
              <strong>Date Range:</strong> {startDate} to {endDate}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <strong>1. Select Configuration</strong>
              <p className="text-gray-600">Choose hotel, audit type, and date range for your compliance report</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 text-green-600 rounded-full p-2 flex-shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <strong>2. Preview Report</strong>
              <p className="text-gray-600">Review the audit structure and tasks before generating the final PDF</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 text-purple-600 rounded-full p-2 flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <strong>3. Download PDF</strong>
              <p className="text-gray-600">Generate and download professional compliance audit reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAuditPDF;
