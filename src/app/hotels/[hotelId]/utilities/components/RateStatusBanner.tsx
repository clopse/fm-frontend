import { useState } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface RateStatusBannerProps {
  hasDefaultRates: boolean;
  hasMixedRates: boolean;
  hotelId: string;
  onUpdate: () => void;
}

export default function RateStatusBanner({ 
  hasDefaultRates, 
  hasMixedRates, 
  hotelId,
  onUpdate 
}: RateStatusBannerProps) {
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateResult(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/chp/reprocess`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('Update failed');
      }
      
      const result = await response.json();
      
      if (result.success) {
        const updated = result.details?.reports_updated || 0;
        if (updated > 0) {
          setUpdateResult(`✓ Updated ${updated} CHP report${updated > 1 ? 's' : ''} with actual rates!`);
        } else {
          setUpdateResult('No updates needed - actual utility bills not yet available for these months.');
        }
      }
      
      // Refresh data
      setTimeout(() => {
        onUpdate();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to update rates:', error);
      setUpdateResult('❌ Failed to update rates. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // All using actual rates - success state
  if (!hasDefaultRates && !hasMixedRates) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Using Actual Rates
            </p>
            <p className="text-xs text-green-700 mt-1">
              All CHP reports are calculated using actual electricity and gas rates from your utility bills.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Using default rates - warning state
  if (hasDefaultRates) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Using Placeholder Rates
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Some CHP reports are using default rates. Upload utility bills for those months, then click "Update Rates" to recalculate with actual rates.
              </p>
              {updateResult && (
                <p className="text-xs text-amber-800 mt-2 font-medium">
                  {updateResult}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="ml-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
          >
            {updating ? 'Updating...' : 'Update Rates'}
          </button>
        </div>
      </div>
    );
  }

  // Mixed rates - info state
  if (hasMixedRates) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Info className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                Partial Actual Rates
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Some CHP reports use actual rates, others use defaults. Upload missing utility bills to improve accuracy.
              </p>
              {updateResult && (
                <p className="text-xs text-blue-800 mt-2 font-medium">
                  {updateResult}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
          >
            {updating ? 'Updating...' : 'Update Rates'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
