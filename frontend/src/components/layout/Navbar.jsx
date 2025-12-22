import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, HeartPulse, Menu } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import useAuthStore from '../../store/useAuthStore';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-primary">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
              RedGrid
            </span>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            
            <SignedIn>
              {user?.role === 'donor' && <Link to="/donor/dashboard" className="hover:text-primary">Dashboard</Link>}
              {user?.role === 'hospital' && <Link to="/hospital/dashboard" className="hover:text-primary">Hospital</Link>}
              {user?.role === 'organization' && <Link to="/org/dashboard" className="hover:text-primary">Organization</Link>}
            </SignedIn>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-yellow-400"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <Link to="/login">
                <button className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-red-700 transition-all shadow-md shadow-red-500/20">
                  Sign In
                </button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;