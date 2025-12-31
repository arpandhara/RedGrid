
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const BackgroundWrapper = ({ children, className = "" }) => {
  return (
    <div className={`relative min-h-screen w-full bg-[#050505] overflow-hidden text-zinc-100 ${className}`}>
      
      {/* ANIMATED MESH GRADIENT LAYERS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Deep Midnight Blue/Purple Base */}
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-950/20 rounded-full blur-[120px] animate-pulse-slow" />
          
          {/* Crimson/Red "Life" Pulse - Top Right */}
          <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-red-900/20 rounded-full blur-[130px] animate-float-slow" />
          
          {/* Bottom Center Glow */}
          <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[60vw] bg-blue-950/10 rounded-full blur-[100px]" />
      </div>

      {/* NOISE TEXTURE OVERLAY (Optional for film grain look) */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* CONTENT */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;
