'use client';

// Skeleton Loaders for Compliance Dashboard

export const ScoreCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
        <div className="h-8 w-24 bg-slate-200 rounded"></div>
      </div>
      <div className="h-16 w-16 bg-slate-200 rounded-full"></div>
    </div>
    <div className="h-2 bg-slate-100 rounded-full mb-4">
      <div className="h-2 bg-slate-300 rounded-full" style={{width: '60%'}}></div>
    </div>
    <div className="h-48 bg-slate-100 rounded-lg"></div>
  </div>
);

export const TaskCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
      </div>
      <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
    </div>
    
    <div className="space-y-2 mb-4">
      <div className="h-4 w-full bg-slate-100 rounded"></div>
      <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
    </div>
    
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="h-4 w-24 bg-slate-200 rounded"></div>
      <div className="h-4 w-20 bg-slate-200 rounded"></div>
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-6 w-32 bg-slate-200 rounded"></div>
      <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </div>
  </div>
);

export const FilterPanelSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-5 w-24 bg-slate-200 rounded"></div>
      <div className="h-4 w-16 bg-slate-100 rounded"></div>
    </div>
    <div className="space-y-3">
      <div className="h-10 bg-slate-100 rounded-lg"></div>
      <div className="h-10 bg-slate-100 rounded-lg"></div>
      <div className="h-10 bg-slate-100 rounded-lg"></div>
    </div>
  </div>
);

export const ComplianceDashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-slate-100 rounded"></div>
      </div>

      {/* Score Card Skeleton */}
      <ScoreCardSkeleton />

      {/* Filters Skeleton */}
      <FilterPanelSkeleton />

      {/* Categories Skeleton */}
      <CategorySkeleton />
      <CategorySkeleton />
    </div>
  </div>
);
