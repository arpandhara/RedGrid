import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, KeyRound, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // GSAP Refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const formRef = useRef(null);

  // --- GSAP ENTRY ANIMATION ---
  useGSAP(() => {
    const tl = gsap.timeline();

    // Image Zoom & Fade In
    if (imageRef.current) {
        tl.from(imageRef.current, {
            scale: 1.1,
            opacity: 0,
            duration: 1.5,
            ease: "power2.out"
        }, 0);
    }

    //Sidebar Content Stagger (Left Panel)
    tl.from('.sidebar-content', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out"
    }, 0.3);

    // Form Elements Stagger (Right Panel)
    tl.from('.form-element', {
        x: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.2)",
        clearProps: "all" // Important for interactions after animation
    }, 0.5);

  }, { scope: containerRef });

  // --- HANDLE STEP CHANGE ANIMATION ---
  const animateStepChange = (nextStep) => {
    const tl = gsap.timeline({
        onComplete: () => setStep(nextStep)
    });

    // Fade out current form
    tl.to('.form-container', {
        x: -20,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
    });
    
    // The state updates here via onComplete, then the new form renders.
    // We use a separate useEffect or key to animate the new one in, 
    // but React's state change combined with GSAP 'from' usually needs a slight delay or 'key' prop.
    // A simpler approach for React:
    setTimeout(() => {
        gsap.fromTo('.form-container', 
            { x: 20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
    }, 350);
  };

  // Handle Step 1: Send OTP
  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Verification code sent to your email');
      animateStepChange(2); // Trigger Animation + State Change
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Login now.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex bg-white dark:bg-zinc-950 font-sans selection:bg-red-500/20 overflow-hidden">
      
      {/* --- LEFT SIDE: Visuals --- */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                ref={imageRef}
                src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?q=80&w=2940&auto=format&fit=crop" 
                alt="Security Background" 
                className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/60 to-black/30" />
        </div>

        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="sidebar-content w-16 h-16 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-red-600/50 ring-1 ring-white/10">
             <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="sidebar-content text-5xl font-bold mb-6 leading-tight">Secure Account Recovery.</h1>
          <p className="sidebar-content text-xl text-gray-300 mb-8 font-light leading-relaxed">
            We take security seriously. Verify your identity to regain access to your life-saving dashboard.
          </p>
          
          <div className="sidebar-content flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
             <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <CheckCircle2 size={20} />
             </div>
             <div>
                <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Security Status</div>
                <div className="text-white font-medium">End-to-End Encrypted</div>
             </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: Form --- */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative">
        
        {/* Back Button */}
        <Link 
            to="/login" 
            className="form-element absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
            <ArrowLeft size={18} /> Back to Login
        </Link>

        <div ref={formRef} className="w-full max-w-md form-container">
            
            {/* Header */}
            <div className="mb-10 form-element">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {step === 1 
                        ? 'No worries, we will send you reset instructions.' 
                        : `Enter the code sent to ${email} and your new password.`
                    }
                </p>
            </div>

            {/* STEP 1: REQUEST OTP */}
            {step === 1 && (
                <form onSubmit={handleSendCode} className="space-y-6">
                    <div className="space-y-2 form-element">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-1">
                            Registered Email
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-gray-400" 
                                placeholder="name@example.com" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="form-element w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <> Send Reset Code <ArrowRight size={18} /> </>}
                    </button>
                </form>
            )}

            {/* STEP 2: VERIFY & RESET */}
            {step === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    
                    {/* OTP Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-1">
                            Verification Code
                        </label>
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
                            <input 
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required 
                                maxLength={6}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all tracking-[0.5em] font-mono text-lg placeholder:tracking-normal" 
                                placeholder="123456" 
                            />
                        </div>
                    </div>

                    {/* New Password Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-1">
                            New Password
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required 
                                minLength={8}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" 
                                placeholder="••••••••" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <> Reset Password <CheckCircle2 size={18} /> </>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-center text-sm text-gray-500 hover:text-red-600 font-medium transition-colors mt-4"
                    >
                        Wrong email? Go back
                    </button>
                </form>
            )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;