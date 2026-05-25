import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface RateStatusBannerProps {
  hasDefaultRates: boolean;
  hasMixedRates: boolean;
  hotelId: string;
  onUpdate: () => void;
}

function RateStatusBanner({ 
  hasDefaultRates, 
  hasMixedRates, 
  hotelId,
  onUpdate 
}: RateStatusBannerProps) {
  const [updating, setUpdating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    
    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/chp/reprocess`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        setTimeout(() => {
          onUpdate();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to update rates:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Determine status
  let status: 'actual' | 'default' | 'mixed' = 'actual';
  let statusText = 'Using actual rates';
  let statusColor = 'text-green-600';
  let bgColor = 'bg-green-50 hover:bg-green-100';
  let borderColor = 'border-green-200';
  let Icon = CheckCircle;

  if (hasDefaultRates) {
    status = 'default';
    statusText = 'Using placeholder rates - click to update with actual bills';
    statusColor = 'text-amber-600';
    bgColor = 'bg-amber-50 hover:bg-amber-100';
    borderColor = 'border-amber-200';
    Icon = AlertCircle;
  } else if (hasMixedRates) {
    status = 'mixed';
    statusText = 'Partial actual rates - click to update';
    statusColor = 'text-blue-600';
    bgColor = 'bg-blue-50 hover:bg-blue-100';
    borderColor = 'border-blue-200';
    Icon = Info;
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleUpdate}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={updating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgColor} ${borderColor} transition-all disabled:opacity-50`}
      >
        <Icon className={`w-4 h-4 ${statusColor}`} />
        <RefreshCw className={`w-3.5 h-3.5 ${statusColor} ${updating ? 'animate-spin' : ''}`} />
        <span className={`text-xs font-medium ${statusColor}`}>
          {updating ? 'Updating...' : 'Refresh CHP Rates'}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && !updating && (
        <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          {statusText}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

export default RateStatusBanner;
export { RateStatusBanner };
