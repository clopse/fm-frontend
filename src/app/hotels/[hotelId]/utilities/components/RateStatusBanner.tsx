// Rate Status Banner - Shows when CHP is using placeholder rates
// Add this component to your CHP dashboard

import { useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';

interface RateStatusBannerProps {
  chpData: any[];  // Your CHP reports
  hotelId: string;
  onReprocess?: () => void;  // Callback after reprocessing
}

export function RateStatusBanner({ chpData, hotelId, onReprocess }: RateStatusBannerProps) {
  const [reprocessing, setReprocessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Check which reports are using default rates
  const reportsWithDefaults = chpData.filter(report => {
    const rateSource = report.raw_data?.rates?.rates_source;
    return rateSource === 'default' || rateSource === 'mixed';
  });

  const hasDefaults = reportsWithDefaults.length > 0;
  const allActual = reportsWithDefaults.length === 0 && chpData.length > 0;

  const handleReprocess = async () => {
    try {
      setReprocessing(true);
      setResult(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/chp/reprocess`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Reprocessing failed');
      }

      const data = await response.json();
      setResult(data.details);

      // Refresh the CHP data
      if (onReprocess) {
        setTimeout(() => onReprocess(), 1000);
      }

    } catch (error) {
      console.error('Reprocessing error:', error);
      setResult({ error: 'Failed to reprocess reports' });
    } finally {
      setReprocessing(false);
    }
  };

  if (!hasDefaults && !allActual) {
    return null;  // No reports yet
  }

  // All reports using actual rates - show success
  if (allActual) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 text-sm">
              ✅ Using Actual Rates
            </h3>
            <p className="text-green-700 text-sm mt-1">
              All CHP reports are using rates from your actual utility bills. Financial calculations are accurate!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Some reports using defaults - show warning with update button
  return (
    <div className="mb-6 space-y-4">
      {/* Warning Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-sm">
              ⚠️ Using Placeholder Rates ({reportsWithDefaults.length} report{reportsWithDefaults.length !== 1 ? 's' : ''})
            </h3>
            <p className="text-amber-700 text-sm mt-1">
              Some CHP reports are using placeholder rates because utility bills haven't been uploaded yet.
              Upload the bills and click "Update Rates" to get accurate financials.
            </p>
            
            {/* List affected months */}
            <div className="mt-2 flex flex-wrap gap-2">
              {reportsWithDefaults.map((report, idx) => {
                const month = report.report_month;
                const rateSource = report.raw_data?.rates?.rates_source;
                const monthName = new Date(month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' });
                
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      rateSource === 'default' 
                        ? 'bg-amber-200 text-amber-800' 
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {monthName} {rateSource === 'mixed' && '(partial)'}
                  </span>
                );
              })}
            </div>

            {/* Update Button */}
            <div className="mt-4">
              <button
                onClick={handleReprocess}
                disabled={reprocessing}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${reprocessing ? 'animate-spin' : ''}`} />
                <span>{reprocessing ? 'Updating...' : 'Update Rates from Bills'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`rounded-xl p-4 border-2 ${
          result.error 
            ? 'bg-red-50 border-red-200' 
            : result.improvements > 0
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            {result.error ? (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : result.improvements > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1">
              {result.error ? (
                <p className="text-red-800 text-sm font-medium">{result.error}</p>
              ) : (
                <>
                  <h4 className={`font-semibold text-sm ${
                    result.improvements > 0 ? 'text-green-900' : 'text-blue-900'
                  }`}>
                    {result.improvements > 0 
                      ? `✅ Updated ${result.improvements} report(s) with actual rates!`
                      : `ℹ️ No new bills found`
                    }
                  </h4>
                  
                  {result.updated_reports && result.updated_reports.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.updated_reports.map((update: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium">{update.month}:</span>{' '}
                          <span className={update.improvement ? 'text-green-700' : 'text-blue-700'}>
                            {update.old_rate_source} → {update.new_rate_source}
                          </span>
                          {update.difference !== 0 && (
                            <span className="ml-2">
                              (Profit: €{update.old_net_profit} → €{update.new_net_profit})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box - How it works */}
      <details className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-blue-900 text-sm flex items-center space-x-2">
          <Info className="w-4 h-4" />
          <span>How placeholder rates work</span>
        </summary>
        <div className="mt-3 text-sm text-blue-800 space-y-2">
          <p>
            <strong>When you upload a CHP report before bills:</strong>
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>System uses default rates (€0.26/kWh electricity, €0.046/kWh gas)</li>
            <li>Calculations are approximate but still useful</li>
            <li>Report shows "using placeholder rates" indicator</li>
          </ul>
          <p className="pt-2">
            <strong>When you upload utility bills:</strong>
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Click "Update Rates" to recalculate CHP reports</li>
            <li>System extracts actual rates from your bills</li>
            <li>Financials update to show accurate profit/costs</li>
            <li>Indicator changes to "using actual rates" ✅</li>
          </ul>
        </div>
      </details>
    </div>
  );
}


// ============================================================
// INDIVIDUAL REPORT RATE INDICATOR
// ============================================================

// Add this to show rate status on individual CHP report cards

export function RateIndicator({ report }: { report: any }) {
  const rateSource = report.raw_data?.rates?.rates_source;
  const elecSource = report.raw_data?.rates?.electricity_source;
  const gasSource = report.raw_data?.rates?.gas_source;

  if (rateSource === 'actual') {
    return (
      <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
        <CheckCircle className="w-3 h-3" />
        <span>Actual rates</span>
      </div>
    );
  }

  if (rateSource === 'mixed') {
    return (
      <div className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
        <AlertCircle className="w-3 h-3" />
        <span>Partial rates</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
      <AlertCircle className="w-3 h-3" />
      <span>Placeholder rates</span>
    </div>
  );
}


// ============================================================
// USAGE IN YOUR CHP DASHBOARD
// ============================================================

/*
// In your page.tsx or CHP dashboard component:

import { RateStatusBanner, RateIndicator } from './components/RateStatusBanner';

export default function UtilitiesDashboard() {
  const { chpData, refetch: refetchCHP } = useCHPData(hotelId);

  return (
    <div>
      {/* Show rate status banner at top of CHP section *\/}
      {hotelId === 'clonshaugh' && chpData.length > 0 && (
        <RateStatusBanner
          chpData={chpData}
          hotelId={hotelId}
          onReprocess={refetchCHP}
        />
      )}

      {/* Your existing CHP chart *\/}
      <CHPChart data={chpData} ... />

      {/* Optional: Show rate indicator on individual report cards *\/}
      {chpData.map(report => (
        <div key={report.report_month} className="...">
          <RateIndicator report={report} />
          {/* Rest of report card *\/}
        </div>
      ))}
    </div>
  );
}
*/
