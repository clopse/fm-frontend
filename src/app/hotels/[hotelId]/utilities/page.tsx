'use client';

import { useParams } from "next/navigation";

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading utilities data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Utilities Overview - SIMPLIFIED TEST
          </h1>
          <p className="text-slate-600">
            This is a simplified version to test navigation. 
            Hotel ID: {hotelId}
          </p>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800">
              ✅ If you can navigate away from this page, the issue was in the complex Overview code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
