import React, { useState } from 'react';
import { useSignUp, useSignIn } from "@clerk/clerk-react";
import { User, Calendar, Building2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomAuth = ({ mode = 'sign-in' }) => {
  const [activeTab, setActiveTab] = useState('donor'); // 'donor', 'organization', 'hospital'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    hospitalName: "",
    organizationName: ""
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'sign-in') {
      if (!isSignInLoaded) return;
      try {
        const result = await signIn.create({
          identifier: formData.email,
          password: formData.password,
        });

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          navigate('/');
        } else {
          console.log(result);
        }
      } catch (err) {
        setError(err.errors[0]?.message || 'Invalid credentials');
      }
    } else {
      // SIGN UP LOGIC
      if (!isSignUpLoaded) return;
      try {
        const result = await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          // THIS IS THE KEY: Sending metadata to webhook
          unsafeMetadata: {
            role: activeTab,
            organizationName: activeTab === 'organization' ? formData.organizationName : null,
            hospitalName: activeTab === 'hospital' ? formData.hospitalName : null
          }
        });

        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          navigate('/');
        } else {
          // If email verification is needed (Clerk default)
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          // Ideally navigate to a verification page here
          alert("Check your email for verification code (Verification UI needed)");
        }
      } catch (err) {
        setError(err.errors[0]?.message || 'Error creating account');
      }
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* TABS (Only show on Sign Up, or if you want separate login flows) */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-xl dark:bg-gray-800">
        {['donor', 'organization', 'hospital'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold capitalize rounded-lg transition-all duration-200 flex items-center justify-center gap-2
              ${activeTab === tab 
                ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            {tab === 'donor' && <User size={16} />}
            {tab === 'organization' && <Calendar size={16} />}
            {tab === 'hospital' && <Building2 size={16} />}
            {tab === 'donor' ? 'Individual' : tab === 'organization' ? 'Event' : tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'sign-up' && (
          <div className="flex gap-4">
            <input name="firstName" placeholder="First Name" onChange={handleChange} className="w-1/2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white" required />
            <input name="lastName" placeholder="Last Name" onChange={handleChange} className="w-1/2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white" required />
          </div>
        )}

        {/* Dynamic Fields based on Tab */}
        {mode === 'sign-up' && activeTab === 'hospital' && (
           <input name="hospitalName" placeholder="Hospital Name" onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white" required />
        )}
        {mode === 'sign-up' && activeTab === 'organization' && (
           <input name="organizationName" placeholder="Organization Name" onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white" required />
        )}

        <input 
            name="email" 
            type="email" 
            placeholder="Email Address" 
            onChange={handleChange} 
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white" 
            required 
        />
        
        <div className="relative">
            <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                onChange={handleChange} 
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white" 
                required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button 
            type="submit" 
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-500/30"
        >
            {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {mode === 'sign-in' ? (
            <>Don't have an account? <a href="/sign-up" className="text-red-600 font-semibold hover:underline">Sign Up</a></>
        ) : (
            <>Already have an account? <a href="/sign-in" className="text-red-600 font-semibold hover:underline">Sign In</a></>
        )}
      </div>
    </div>
  );
};

export default CustomAuth;