import React from 'react';

const SkeletonLayout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex">
      {/* Fake Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 p-4 space-y-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-full bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
            ))}
        </div>
      </div>

      {/* Fake Content */}
      <div className="flex-1 p-8 space-y-6">
        {/* Top Bar Skeleton */}
        <div className="h-4 w-full bg-red-600/20 rounded-full overflow-hidden">
             <div className="h-full w-1/3 bg-red-600 animate-[loading_1s_ease-in-out_infinite]" /> 
        </div>
        
        <div className="h-12 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1, 2, 3].map(i => (
                 <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
             ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLayout;