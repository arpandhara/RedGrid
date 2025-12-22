import React, { useState } from 'react';
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, Eye, EyeOff, Loader, Chrome } from 'lucide-react';

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("OAuth Error:", err);
      setError("Failed to initialize Google Sign-In");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate('/'); // App.jsx will handle redirection to the correct dashboard
      } else {
        console.log(result);
        setError("Login incomplete. Please check your credentials.");
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">
      {/* Sidebar / Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-orange-600/20 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=2833&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />
        
        <div className="relative z-20 text-center px-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-600/30">
              <HeartPulse className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome Back</h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            "Your contribution is the heartbeat of our community. Log in to continue saving lives."
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign In</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              New to RedGrid? <Link to="/register" className="font-semibold text-red-600 hover:text-red-500 transition-colors">Create an account</Link>
            </p>
          </div>

          <div className="space-y-4">
             {/* Google Login Button */}
             <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200 font-medium"
              >
                <Chrome size={20} className="text-blue-500" />
                Sign in with Google
              </button>

              <div className="relative flex items-center justify-center text-sm">
                 <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                 </div>
                 <span className="relative px-2 bg-white dark:bg-black text-gray-500">Or sign in with email</span>
              </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                   <button type="button" className="text-sm font-medium text-red-600 hover:text-red-500">
                     Forgot password?
                   </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader className="animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;