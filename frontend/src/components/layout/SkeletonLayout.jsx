import React from 'react';

const SkeletonLayout = () => {
  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      
      {/* Sidebar Skeleton - Forced Dark Colors */}
      <div className="hidden md:flex w-64 flex-col border-r border-zinc-800 p-6 space-y-8 bg-black">
        {/* Logo Placeholder */}
        <div className="flex items-center gap-3">
             {/* <div className="w-8 h-8 bg-zinc-900 rounded-lg animate-pulse" /> */}
             {/* <div className="h-6 w-24 bg-zinc-900 rounded animate-pulse" /> */}
        </div>

        {/* Nav Items Skeleton */}
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-full bg-zinc-900/40 rounded-xl animate-pulse" />
            ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-8 space-y-8 bg-black">
        {/* Top Loading Bar (YouTube Style) - Red */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden absolute top-0 left-0">
             <div className="h-full w-1/3 bg-red-600 animate-[loading_1s_ease-in-out_infinite]" /> 
        </div>
        
        {/* Header Text */}
        <div className="h-10 w-64 bg-zinc-900 rounded-lg animate-pulse mt-4" />
        
        {/* Dashboard Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1, 2, 3].map(i => (
                 <div key={i} className="h-48 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
             ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLayout;