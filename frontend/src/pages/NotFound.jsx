import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home, Copy, Quote } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';



const NotFound = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // Select a random quote on mount

  useGSAP(() => {
    const tl = gsap.timeline();

    // Ambient Background Animation
    tl.from('.bg-decor', { 
      scale: 0, 
      opacity: 0, 
      duration: 1.5, 
      ease: "power2.out" 
    })
    // Content Stagger
    .from('.content-item', { 
      y: 30, 
      opacity: 0, 
      duration: 0.8, 
      stagger: 0.1, 
      ease: "back.out(1.7)" 
    }, "-=1");

  }, { scope: containerRef });

  const copyQuote = () => {
    navigator.clipboard.writeText(`"${randomQuote.text}"`);
    toast.success("Quote copied to clipboard!");
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-6 relative overflow-hidden font-sans selection:bg-red-500/30">
      
      {/* Dynamic Background Blobs */}
      <div className="bg-decor absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="bg-decor absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animation-delay-2000" />

      <div className="relative z-10 max-w-2xl w-full text-center">
        
        {/* 404 Visual Art */}
        <div className="content-item mb-8 relative inline-block group">
          <div className="text-[10rem] sm:text-[12rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-br from-gray-200 to-transparent dark:from-gray-800 dark:to-transparent select-none transition-colors group-hover:from-gray-300 dark:group-hover:from-gray-700">
            404
          </div>
          
          {/* Floating Card */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-red-500/20 border border-gray-100 dark:border-gray-800 transform rotate-12 group-hover:rotate-0 transition-transform duration-500 ease-out">
                <AlertTriangle className="w-16 h-16 text-red-500 drop-shadow-lg" />
             </div>
          </div>
        </div>

        {/* Main Text */}
        <h2 className="content-item text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Lost in the grid?
        </h2>
        <p className="content-item text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
          The page you are looking for has vanished, but the need for heroes hasn't.
        </p>

        {/* Action Buttons */}
        <div className="content-item flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)} 
            className="px-8 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 hover:-translate-x-1"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <Link 
            to="/" 
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;