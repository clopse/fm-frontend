'use client';

import React from 'react';

const Block = React.memo(function Block({
  className,
}: {
  className: string;
}) {
  return <div className={`bg-slate-200 rounded ${className}`} />;
});

export const ComplianceDashboardSkeleton = React.memo(function ComplianceDashboardSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Block className="h-4 w-40" />
            <Block className="h-9 w-28" />
          </div>
          <Block className="h-14 w-14 rounded-full" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-2 bg-slate-100 rounded-full">
            <div className="h-2 bg-slate-300 rounded-full w-3/5" />
          </div>
          <div className="flex justify-between">
            <Block className="h-3 w-24" />
            <Block className="h-3 w-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="flex flex-wrap gap-3 items-center">
          <Block className="h-10 w-56" />
          <Block className="h-10 w-44" />
          <Block className="h-10 w-44" />
          <Block className="h-10 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="flex justify-between gap-4">
              <div className="space-y-3 flex-1">
                <Block className="h-4 w-3/4" />
                <Block className="h-3 w-1/2" />
                <Block className="h-3 w-2/3" />
              </div>
              <Block className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-4 flex justify-between">
              <Block className="h-3 w-24" />
              <Block className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
