import React, { useState, useRef } from 'react';
// 1. Import GoogleOneTap
import { useSignIn, GoogleOneTap } from "@clerk/clerk-react"; 
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowRight, HeartPulse, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  
  // GSAP Refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const formRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- GSAP ANIMATION ---
  useGSAP(() => {
    const tl = gsap.timeline();

    // Image Zoom In
    if (imageRef.current) {
        tl.from(imageRef.current, {
            scale: 1.1,
            opacity: 0,
            duration: 2,
            ease: "power2.out"
        }, 0);
    }

    // Sidebar Content Stagger
    tl.from('.sidebar-content', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out"
    }, 0.5);

    // Form Stagger - ensure the class exists
    tl.from('.form-element', {
        x: 20,
        opacity: 0, // If this fails to run, elements might stay hidden. 
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.2)",
        clearProps: "all" // Ensures styles are removed after animation to prevent bugs
    }, 0.5);

  }, { scope: containerRef });

  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    setIsGoogleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("OAuth Error:", err);
      setError("Failed to initialize Google Log In");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate('/');
      } else {
        console.log(result);
        setError("Login incomplete. Check console.");
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex bg-white dark:bg-zinc-950 font-sans selection:bg-red-500/20 overflow-hidden">
      
      {/* 2. Add Google One Tap for Instant Login */}
      <GoogleOneTap cancelOnTapOutside />

      {/* Left Side: Visuals */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                ref={imageRef}
                src="https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?q=80&w=2940&auto=format&fit=crop" 
                alt="Medical Background" 
                className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/60 to-black/30" />
        </div>

        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="sidebar-content w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-red-600/50">
             <HeartPulse size={32} className="text-white" />
          </div>
          <h1 className="sidebar-content text-5xl font-bold mb-6 leading-tight">Welcome Back.</h1>
          <p className="sidebar-content text-xl text-gray-300 mb-8 font-light">
            Your contribution makes a difference. Access your dashboard to manage donations and requests.
          </p>
          
          <div className="sidebar-content bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
             <div className="text-sm text-gray-300 uppercase tracking-widest mb-1">Total Lives Impacted</div>
             <div className="text-4xl font-bold text-white">1.2M+</div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12">
        <div ref={formRef} className="w-full max-w-md">
          
          <div className="mb-10 form-element">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Log In</h2>
            <p className="text-gray-500 dark:text-gray-400">
              New to RedGrid? <Link to="/register" className="text-red-600 hover:text-red-700 font-semibold hover:underline">Create an account</Link>
            </p>
          </div>

          {/* GOOGLE LOGIN BUTTON */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="form-element w-full relative group overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-center gap-3 transition-all hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 mb-8"
          >
             {isGoogleLoading ? <Loader2 className="animate-spin text-gray-400" /> : (
                <>
                {/* SVG Google Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-200">Continue with Google</span>
                </>
             )}
          </button>

          <div className="relative mb-8 form-element">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-zinc-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white dark:bg-zinc-950 px-4 text-gray-400">Or log in with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 form-element">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-1">Email</label>
              <input name="email" type="email" onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" placeholder="name@example.com" />
            </div>

            <div className="space-y-2 form-element">
              <div className="flex justify-between items-center px-1">
                 <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Password</label>
                 <a href="#" className="text-xs text-red-600 hover:text-red-500 font-medium">Forgot password?</a>
              </div>
              <div className="relative group">
                <input name="password" type={showPassword ? "text" : "password"} onChange={handleChange} required className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-black focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="form-element p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="form-element w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 group">
              {isLoading ? <Loader2 className="animate-spin" /> : <> Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /> </>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;