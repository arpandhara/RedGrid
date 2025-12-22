import React, { useState } from 'react';
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from 'react-router-dom';
import { User, Building2, Calendar, Eye, EyeOff, Loader, CheckCircle, Chrome } from 'lucide-react';

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('donor'); // 'donor', 'hospital', 'organization'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    hospitalName: "",
    orgName: ""
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle Google OAuth
  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("OAuth Error:", err);
      setError("Failed to initialize Google Sign-In");
    }
  };

  // Step 1: Create Account
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

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Error creating account.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Email
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/'); // Redirects to App.jsx -> Root -> Dashboard
      } else {
        console.log(completeSignUp);
        setError("Verification incomplete. Check console.");
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your Email</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We sent a code to <span className="font-semibold text-gray-900 dark:text-white">{formData.email}</span>
          </p>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center text-2xl tracking-widest py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="000000"
            />
             {error && <p className="text-red-600 text-sm">{error}</p>}
             <button type="submit" disabled={isLoading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
               {isLoading ? <Loader className="animate-spin mx-auto" /> : "Verify Account"}
             </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">
      {/* Sidebar Panel */}
      <div className="hidden lg:flex lg:w-1/3 relative bg-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
        
        <div className="relative z-20 px-8 text-white">
          <h1 className="text-4xl font-bold mb-4">Join RedGrid</h1>
          <ul className="space-y-4 text-lg text-gray-300">
            <li className="flex items-center gap-3"><CheckCircle size={20} className="text-red-500" /> Save lives by donating blood</li>
            <li className="flex items-center gap-3"><CheckCircle size={20} className="text-red-500" /> Manage hospital inventory</li>
            <li className="flex items-center gap-3"><CheckCircle size={20} className="text-red-500" /> Organize donation drives</li>
          </ul>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h2>
            <Link to="/login" className="text-sm font-semibold text-red-600 hover:underline">
              Already have an account?
            </Link>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {[
              { id: 'donor', label: 'Individual', icon: User },
              { id: 'hospital', label: 'Hospital', icon: Building2 },
              { id: 'organization', label: 'Organization', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeTab === id 
                    ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Google Login (ONLY FOR INDIVIDUALS) */}
          {activeTab === 'donor' && (
            <div className="mb-6">
              <button 
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200 font-medium"
              >
                <Chrome size={20} className="text-blue-500" />
                Sign up with Google
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-black text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input
                  name="firstName"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input
                  name="lastName"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Dynamic Fields */}
            {activeTab === 'hospital' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hospital Name</label>
                <input
                  name="hospitalName"
                  placeholder="e.g. City General Hospital"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization / Event Name</label>
                <input
                  name="orgName"
                  placeholder="e.g. Red Cross Local Chapter"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
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
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-500/30 text-lg flex justify-center items-center"
            >
              {isLoading ? <Loader className="animate-spin" /> : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;