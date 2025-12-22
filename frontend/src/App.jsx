import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Moon, Sun, HeartPulse, Menu } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignIn, SignUp } from "@clerk/clerk-react";
import { dark } from '@clerk/themes';
import AuthLayout from './components/AuthLayout';

// 1. Modern Floating Navbar
const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50 rounded-full border border-white/20 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors dark:bg-red-900/30">
            <HeartPulse className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-white tracking-wide">RedGrid</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <a href="#" className="hover:text-primary transition-colors">Donors</a>
          <a href="#" className="hover:text-primary transition-colors">About</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-yellow-400"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Link to="/sign-in">
              <button className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95">
                Sign In
              </button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

// 2. Landing Page Component
const LandingPage = () => (
  <div className="min-h-screen relative flex items-center justify-center bg-gray-50 dark:bg-black overflow-hidden">
     {/* Decorative Blobs */}
     <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[100px]" />
     <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px]" />

     <div className="text-center z-10 px-4 max-w-3xl mt-20">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
          Save Lives Today
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
          Be the reason <br/> someone <span className="text-primary italic">smiles.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          Connecting donors with those in need. Simple, fast, and life-saving. 
          Join the RedGrid network and make a difference in your community.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/sign-up" className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-1 transition-all w-full sm:w-auto">
              Start Donating
            </Link>
            <button className="px-8 py-4 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all w-full sm:w-auto">
              Learn More
            </button>
        </div>
     </div>
  </div>
);

// 3. Main App Structure
function App() {
  const { theme } = useTheme();
  
  // Clerk Appearance Prop to match your dark mode
  const clerkAppearance = {
    baseTheme: theme === 'dark' ? dark : undefined,
    variables: { 
      colorPrimary: '#E63946',
      colorBackground: theme === 'dark' ? '#000000' : '#ffffff', 
      colorInputBackground: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
    },
    elements: {
      card: 'shadow-none bg-transparent', // Remove default Clerk shadow/bg so it blends
      rootBox: 'w-full',
    }
  };

  return (
    <BrowserRouter>
      <div className="text-gray-900 dark:text-white transition-colors duration-300">
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />

          {/* Sign In Page (Split Screen) */}
          <Route 
            path="/sign-in/*" 
            element={
              <AuthLayout title="Welcome Back" subtitle="Please enter your details to sign in.">
                <SignIn appearance={clerkAppearance} routing="path" path="/sign-in" signUpUrl="/sign-up" />
              </AuthLayout>
            } 
          />

          {/* Sign Up Page (Split Screen) */}
          <Route 
            path="/sign-up/*" 
            element={
              <AuthLayout title="Create Account" subtitle="Start your journey to saving lives.">
                <SignUp appearance={clerkAppearance} routing="path" path="/sign-up" signInUrl="/sign-in" />
              </AuthLayout>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const AppWrapper = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWrapper;