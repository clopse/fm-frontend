'use client';

import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Building,
  Clock,
  FileText
} from 'lucide-react';

interface MatrixEntry {
  hotel_id: string;
  task_id: string;
  status: 'compliant' | 'grace_period' | 'non_compliant' | 'pending';
  last_completed?: string;
  due_date?: string;
  days_overdue?: number;
}

interface TaskInfo {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  mandatory: boolean;
  points: number;
}

interface ComplianceMatrixProps {
  matrixData: MatrixEntry[];
  filteredTasks: TaskInfo[];
  filteredHotels: Array<{ id: string; name: string }>;
  onCellClick: (hotelName: string, taskLabel: string, status: string) => void;
  loading: boolean;
}

export default function ComplianceMatrix({ 
  matrixData, 
  filteredTasks, 
  filteredHotels, 
  onCellClick, 
  loading 
}: ComplianceMatrixProps) {
  
  // Get compliance status for a specific hotel-task combination
  const getComplianceStatus = (hotelId: string, taskId: string): string => {
    const entry = matrixData.find(item => 
      item.hotel_id === hotelId && item.task_id === taskId
    );
    
    if (entry) {
      return entry.status;
    }
    
    // Generate mock status if no real data (for demo purposes)
    if (matrixData.length === 0) {
      const mockStatuses = ['compliant', 'grace_period', 'non_compliant'];
      const hash = (hotelId + taskId).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return mockStatuses[Math.abs(hash) % mockStatuses.length];
    }
    
    return 'non_compliant';
  };

  // Get status display components
  const getStatusDisplay = (status: string) => {
    const configs: Record<string, {
      icon: JSX.Element;
      color: string;
      text: string;
    }> = {
      compliant: {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        color: 'bg-green-100 hover:bg-green-200 border-green-200',
        text: 'Compliant'
      },
      grace_period: {
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
        color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200',
        text: 'Grace Period'
      },
      non_compliant: {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        color: 'bg-red-100 hover:bg-red-200 border-red-200',
        text: 'Non-Compliant'
      },
      pending: {
        icon: <AlertTriangle className="w-5 h-5 text-gray-600" />,
        color: 'bg-gray-100 hover:bg-gray-200 border-gray-200',
        text: 'Pending'
      }
    };
    
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading compliance matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Container with controlled horizontal scroll */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-full inline-block align-top">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Sticky Hotel Column Header */}
                <th className="sticky left-0 bg-gray-50 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[220px] z-20">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Hotel Property
                  </div>
                </th>
                
                {/* Task Column Headers */}
                {filteredTasks.map((task) => (
                  <th 
                    key={task.task_id} 
                    className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] border-r border-gray-200 whitespace-nowrap"
                    title={`${task.label} - ${task.frequency}`}
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900 leading-tight">{task.label}</div>
                      <div className="text-xs text-gray-400 font-normal">{task.frequency}</div>
                      <div className="text-xs text-blue-600 font-normal">{task.category}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredHotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                  {/* Sticky Hotel Name Column */}
                  <td className="sticky left-0 bg-white px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 z-10">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{hotel.name}</span>
                    </div>
                  </td>
                  
                  {/* Status Cells */}
                  {filteredTasks.map((task) => {
                    const status = getComplianceStatus(hotel.id, task.task_id);
                    const statusConfig = getStatusDisplay(status);
                    return (
                      <td 
                        key={`${hotel.id}-${task.task_id}`}
                        className={`px-4 py-4 text-center cursor-pointer transition-all border-r border-gray-200 ${statusConfig.color} min-w-[140px]`}
                        onClick={() => onCellClick(hotel.name, task.label, statusConfig.text)}
                        title={`${hotel.name} - ${task.label}: ${statusConfig.text}`}
                      >
                        <div className="flex items-center justify-center">
                          {statusConfig.icon}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Empty State */}
      {filteredHotels.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-500">
            No hotels match your current filter criteria. Try adjusting your filters.
          </p>
        </div>
      )}
    </>
  );
}
