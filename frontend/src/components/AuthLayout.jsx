import React, { useState } from 'react';
import { useSignUp, useSignIn } from "@clerk/clerk-react";
import { User, Calendar, Stethoscope } from 'lucide-react'; // Assuming you have lucide-react or similar icons

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('individual'); // 'individual', 'event', 'hospital'
  
  // Clerk Hooks
  const { isLoaded: isLoadedSignUp, signUp, setActive: setActiveSignUp } = useSignUp();
  const { isLoaded: isLoadedSignIn, signIn, setActive: setActiveSignIn } = useSignIn();

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    hospitalName: "", // Specific to Hospital
    orgName: ""       // Specific to Event
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      // HANDLE LOGIN LOGIC HERE
      if (!isLoadedSignIn) return;
      try {
        const result = await signIn.create({
          identifier: formData.email,
          password: formData.password,
        });
        if (result.status === "complete") {
          await setActiveSignIn({ session: result.createdSessionId });
        }
      } catch (err) {
        console.error("Login error", err);
      }
    } else {
      // HANDLE SIGNUP LOGIC
      if (!isLoadedSignUp) return;
      try {
        // We pass the role in 'unsafe_metadata' so the Webhook can see it
        const result = await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          unsafeMetadata: {
            role: activeTab, // This sends 'individual', 'event', or 'hospital' to backend
            organization: activeTab === 'event' ? formData.orgName : null,
            hospitalName: activeTab === 'hospital' ? formData.hospitalName : null
          }
        });
        
        // Prepare for email verification (omitted for brevity, usually involves verifyEmail step)
        if (result.status === "complete") {
            await setActiveSignUp({ session: result.createdSessionId });
        } else {
            // Navigate to verification code step
            console.log("Next step: verify email");
        }

      } catch (err) {
        console.error("Signup error", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Please access your account below</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('individual')}
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 transition-all ${activeTab === 'individual' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User size={18} /> Individual
          </button>
          <button 
            onClick={() => setActiveTab('event')}
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 transition-all ${activeTab === 'event' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar size={18} /> Event
          </button>
          <button 
            onClick={() => setActiveTab('hospital')}
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 transition-all ${activeTab === 'hospital' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Stethoscope size={18} /> Hospital
          </button>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Role Specific Fields (Only show on SignUp) */}
            {!isLogin && activeTab === 'event' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input 
                  name="orgName"
                  type="text" 
                  value={formData.orgName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="Event Organizer Co."
                />
              </div>
            )}

            {!isLogin && activeTab === 'hospital' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Clinic Name</label>
                <input 
                  name="hospitalName"
                  type="text" 
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="City General Hospital"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className={`w-full text-white font-bold py-3 rounded-lg transition-colors mt-6
                ${activeTab === 'individual' ? 'bg-slate-900 hover:bg-slate-800' : ''}
                ${activeTab === 'event' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                ${activeTab === 'hospital' ? 'bg-red-500 hover:bg-red-600' : ''}
              `}
            >
              {isLogin ? `Sign In as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-600 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;