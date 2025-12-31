import React from 'react';

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`} />
);

export const CardSkeleton = () => (
    <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl w-full">
        <div className="flex gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <div className="flex gap-4 py-4 px-6 border-b border-zinc-800/50 items-center">
        <Skeleton className="w-24 h-6 rounded" />
        <div className="flex-1 space-y-2">
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="w-1/4 h-3" />
        </div>
        <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
);
