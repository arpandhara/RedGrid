
import React from 'react';
import { HeartPulse } from 'lucide-react';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="relative">
        {/* Pulsing Ring */}
        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping blur-xl"></div>
        {/* Icon */}
        <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-900/50">
           <HeartPulse size={32} className="text-white animate-pulse" />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
         <h3 className="text-xl font-bold tracking-tight">RedGrid</h3>
         <p className="text-zinc-500 text-sm animate-pulse">Loading experience...</p>
      </div>
    </div>
  );
};

export default LoadingFallback;
