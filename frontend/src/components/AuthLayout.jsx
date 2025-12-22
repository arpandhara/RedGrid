import React from 'react';
import { HeartPulse, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* LEFT SIDE: Artistic/Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <img 
          src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=1000&auto=format&fit=crop" 
          alt="Blood Donation" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Text Content over Image */}
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/50">
                <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-wider">RedGrid</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Every drop is a <span className="text-red-500">story of life.</span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Join a community of heroes. Your contribution today becomes someone's heartbeat tomorrow.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        {/* Back to Home Button */}
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            
            {/* The Clerk Component will be injected here */}
            <div className="flex justify-center lg:justify-start">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;