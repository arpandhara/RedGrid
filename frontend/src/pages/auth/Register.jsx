import React, { useState, useRef } from 'react';
import { useSignUp, GoogleOneTap } from "@clerk/clerk-react";
import { useNavigate, Link } from 'react-router-dom';
import { User, Building2, Calendar, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  // GSAP Refs
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const sidebarRef = useRef(null);
  const sidebarImageRef = useRef(null);

  const [activeTab, setActiveTab] = useState('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", hospitalName: "", orgName: ""
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- GSAP ANIMATIONS ---
  useGSAP(() => {
    if (verifying) return; 

    const tl = gsap.timeline();
    
    // 1. Sidebar Intro
    if (sidebarRef.current && sidebarImageRef.current) {
        tl.from(sidebarImageRef.current, {
          scale: 1.2,
          duration: 2.5,
          ease: "power2.out"
        }, 0)
        .from(sidebarRef.current.querySelectorAll('.sidebar-text'), {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out"
        }, 0.2);
    }

    // 2. Form Intro (Added clearProps to ensure visibility after animation)
    tl.from(containerRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, 0.3)
    .from(formRef.current.querySelectorAll('.input-group'), {
      x: -20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all" // CRITICAL FIX: Removes inline styles after animation so elements stay visible
    }, 0.6);

  }, { scope: containerRef, dependencies: [verifying] });

  // Handle Google
  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    setIsGoogleLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to initialize Google Sign-In");
      setIsGoogleLoading(false);
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        unsafeMetadata: {
          role: activeTab,
          hospitalName: activeTab === 'hospital' ? formData.hospitalName : null,
          organizationName: activeTab === 'organization' ? formData.orgName : null,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || "Error creating account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        setError("Verification incomplete.");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 font-sans">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 rounded-3xl shadow-2xl shadow-red-900/10 border border-gray-100 dark:border-zinc-800 text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-red-600 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check your inbox</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            We've sent a code to <span className="font-semibold text-gray-900 dark:text-white">{formData.email}</span>
          </p>
          <form onSubmit={handleVerify} className="space-y-6">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center text-4xl font-mono tracking-[0.5em] py-4 bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
              placeholder="000000" maxLength={6}
            />
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Launch"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen flex bg-white dark:bg-zinc-950 font-sans selection:bg-red-500/20 overflow-hidden">
      
      {/* Sidebar */}
      <div ref={sidebarRef} className="hidden lg:flex lg:w-[45%] relative bg-black items-center justify-center overflow-hidden h-screen sticky top-0">
        <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
                ref={sidebarImageRef}
                src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=2883&auto=format&fit=crop" 
                alt="Abstract" 
                className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 via-black/50 to-black/30 mix-blend-multiply" />
        </div>

        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="sidebar-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> RedGrid Network
          </div>
          <h1 className="sidebar-text text-5xl font-bold mb-6 leading-tight">
            Connect. Donate. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Save a Life.</span>
          </h1>
          <p className="sidebar-text text-lg text-gray-300 mb-8 leading-relaxed">
            Join the most advanced blood donation network. Real-time inventory, instant donor connection.
          </p>
          <div className="sidebar-text flex gap-4">
             <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-600 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                ))}
             </div>
             <div className="flex flex-col justify-center">
                <span className="font-bold">10k+ Donors</span>
                <span className="text-xs text-gray-400">Joined this month</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Form Area - FIXED SCROLLING AND LAYOUT */}
      {/* Change: Removed 'items-center' to prevent clipping on small screens/tall forms.
         Added 'my-auto' to the child div to center it when space allows.
      */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center p-6 sm:p-12 overflow-y-auto relative h-screen">
        {activeTab === 'donor' && <GoogleOneTap cancelOnTapOutside />}
        
        <div className="w-full max-w-xl my-auto mx-auto">
          <div className="mb-8 input-group">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Already a member? <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold hover:underline">Log in here</Link>
            </p>
          </div>

          {/* Tabs */}
          <div className="input-group bg-gray-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl flex gap-1 mb-8 border border-gray-200 dark:border-zinc-800">
            {[
              { id: 'donor', label: 'Individual', icon: User },
              { id: 'hospital', label: 'Hospital', icon: Building2 },
              { id: 'organization', label: 'Organization', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === id 
                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Google Auth */}
          {activeTab === 'donor' && (
            <div className="mb-8 input-group">
              <button 
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full relative group overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-center gap-3 transition-all hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                {isGoogleLoading ? <Loader2 className="animate-spin text-gray-400" /> : (
                  <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" />
                  </svg>
                  <span className="font-medium text-gray-700 dark:text-gray-200">Sign up with Google</span>
                  </>
                )}
              </button>
              <div className="relative mt-8 mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-zinc-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white dark:bg-zinc-950 px-4 text-gray-400">Or continue with email</span></div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4 input-group">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">First Name</label>
                <input name="firstName" onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none transition-all" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">Last Name</label>
                <input name="lastName" onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none transition-all" placeholder="Doe" />
              </div>
            </div>

            {/* Dynamic Fields */}
            {activeTab === 'hospital' && (
              <div className="space-y-2 input-group">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">Hospital Name</label>
                <input name="hospitalName" onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:border-red-500 outline-none" placeholder="St. Mary's" />
              </div>
            )}
            
            {activeTab === 'organization' && (
               <div className="space-y-2 input-group">
                 <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">Organization Name</label>
                 <input name="orgName" onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:border-red-500 outline-none" placeholder="Red Cross" />
               </div>
            )}

            <div className="space-y-2 input-group">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">Email</label>
              <input name="email" type="email" onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none transition-all" placeholder="name@example.com" />
            </div>

            <div className="space-y-2 input-group">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 pl-1">Password</label>
              <div className="relative group">
                <input name="password" type={showPassword ? "text" : "password"} onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none transition-all" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="input-group p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> {error}
              </div>
            )}

            {/* Added 'input-group' to ensure it animates, and specific padding/margin to prevent clipping */}
            <button type="submit" disabled={isLoading} className="input-group w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 group mt-4">
              {isLoading ? <Loader2 className="animate-spin" /> : <> Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /> </>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;