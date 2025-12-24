import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axios";
import { useUser } from "@clerk/clerk-react";
import { Save, Loader2, User, MapPin, Activity } from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { user: dbUser, checkUser } = useAuthStore();
  const { user: clerkUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bloodGroup: "", // Usually read-only
  });

  // Load initial data
  useEffect(() => {
    if (dbUser) {
      setFormData({
        firstName: dbUser.firstName || "",
        lastName: dbUser.lastName || "",
        phone: dbUser.phone || "",
        address: dbUser.location?.address || "",
        city: dbUser.location?.city || "",
        state: dbUser.location?.state || "",
        zipCode: dbUser.location?.zipCode || "",
        bloodGroup: dbUser.donorData?.bloodGroup || "N/A",
      });
    }
  }, [dbUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Construct payload matching backend structure
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };

      await api.put("/user/profile", payload);
      
      // Refresh local store
      const token = await window.Clerk.session.getToken();
      await checkUser(token);
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center pb-6 border-b border-zinc-800">
        <div className="relative group">
           <img 
             src={clerkUser?.imageUrl} 
             alt="Profile" 
             className="w-24 h-24 rounded-2xl border-2 border-zinc-800 object-cover group-hover:border-red-600 transition-colors"
           />
           <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-not-allowed">
              <span className="text-xs font-medium text-white">Managed by Clerk</span>
           </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-zinc-500 mt-1">Manage your personal information and preferences.</p>
          <div className="flex gap-2 mt-3">
             <span className="px-3 py-1 bg-red-900/20 text-red-500 text-xs font-bold uppercase tracking-wider rounded-full border border-red-900/30">
               {dbUser?.role || "User"}
             </span>
             <span className="px-3 py-1 bg-zinc-900 text-zinc-400 text-xs font-medium rounded-full border border-zinc-800">
               {clerkUser?.primaryEmailAddress?.emailAddress}
             </span>
          </div>
        </div>
      </div>

      {/* 2. Form Section */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section: Personal Details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User size={18} className="text-red-500" /> Personal Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
            <InputGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
            <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            
            {/* Read Only Field */}
            <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Blood Group (Read-Only)</label>
                <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 font-medium flex items-center gap-2 cursor-not-allowed">
                    <Activity size={16} />
                    {formData.bloodGroup}
                </div>
            </div>
          </div>
        </section>

        {/* Section: Location */}
        <section className="space-y-4 pt-4 border-t border-zinc-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin size={18} className="text-red-500" /> Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <InputGroup label="Street Address" name="address" value={formData.address} onChange={handleChange} className="md:col-span-2" />
             <InputGroup label="City" name="city" value={formData.city} onChange={handleChange} />
             <InputGroup label="State" name="state" value={formData.state} onChange={handleChange} />
             <InputGroup label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex justify-end pt-6 border-t border-zinc-800">
           <button 
             type="submit" 
             disabled={isLoading}
             className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
             Save Changes
           </button>
        </div>

      </form>
    </div>
  );
};

// Reusable Input Component for this Page
const InputGroup = ({ label, name, value, onChange, className = "", type = "text" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-zinc-600"
      placeholder={`Enter ${label.toLowerCase()}...`}
    />
  </div>
);

export default Settings;