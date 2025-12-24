import React, { useState, useEffect, useRef } from "react";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axios";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react"; 
import { 
  Save, Loader2, User, Activity, 
  Building2, Stethoscope, Syringe, Plane, Shield,
  MapPin, Phone, Hash, Globe, CheckCircle2, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Settings = () => {
  const { user: dbUser, checkUser } = useAuthStore();
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const { getToken } = useAuth(); 
  
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const saveBtnRef = useRef(null);

  // --- ANIMATIONS ---
  useGSAP(() => {
    // 1. Staggered Entrance (Fade Up)
    gsap.fromTo(".animate-enter",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", clearProps: "all" }
    );

    // 2. Background Blob "Breathing"
    gsap.to(".bg-blob", {
      scale: 1.1,
      opacity: 0.8,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: containerRef });

  // Initial State
  const [formData, setFormData] = useState({
    // Common
    firstName: "",
    lastName: "",
    phone: "",
    
    // Location
    address: "",
    city: "",
    state: "",
    zipCode: "",

    // Donor Specific
    bloodGroup: "",
    dob: "",
    weight: "",
    gender: "",
    isAvailable: true,
    medications: "",
    healthConditions: "",
    hasTattooOrPiercing: false,
    hasTravelledRecently: false,

    // Hospital Specific
    hospitalName: "",
    registrationNumber: "",
    bedsCount: "",
    emergencyPhone: "",
    website: "",
    hospitalType: "private",

    // Org Specific
    organizationName: "",
    representativeName: "",
    licenseNumber: ""
  });

  // Load Data
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

        // Donor Map
        bloodGroup: dbUser.donorProfile?.bloodGroup || "",
        dob: dbUser.donorProfile?.dob ? new Date(dbUser.donorProfile.dob).toISOString().split('T')[0] : "",
        weight: dbUser.donorProfile?.weight || "",
        gender: dbUser.donorProfile?.gender || "",
        isAvailable: dbUser.donorProfile?.isAvailable ?? true,
        medications: dbUser.donorProfile?.medications || "",
        healthConditions: dbUser.donorProfile?.healthConditions?.join(", ") || "",
        hasTattooOrPiercing: dbUser.donorProfile?.hasTattooOrPiercing || false,
        hasTravelledRecently: dbUser.donorProfile?.hasTravelledRecently || false,

        // Hospital Map
        hospitalName: dbUser.hospitalProfile?.hospitalName || "",
        registrationNumber: dbUser.hospitalProfile?.registrationNumber || "",
        bedsCount: dbUser.hospitalProfile?.bedsCount || "",
        emergencyPhone: dbUser.hospitalProfile?.emergencyPhone || "",
        website: dbUser.hospitalProfile?.website || "",
        hospitalType: dbUser.hospitalProfile?.type || "private",

        // Org Map
        organizationName: dbUser.orgProfile?.organizationName || "",
        representativeName: dbUser.orgProfile?.representativeName || "",
        licenseNumber: dbUser.orgProfile?.licenseNumber || ""
      });
    }
  }, [dbUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Micro-interaction: Shrink button on click
    gsap.to(saveBtnRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

    try {
      const token = await getToken();
      
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

      if (dbUser.role === 'donor') {
        payload.donorData = {
          bloodGroup: formData.bloodGroup,
          dob: formData.dob,
          weight: Number(formData.weight),
          gender: formData.gender,
          isAvailable: formData.isAvailable,
          medications: formData.medications,
          healthConditions: formData.healthConditions.split(',').map(s => s.trim()).filter(Boolean),
          hasTattooOrPiercing: formData.hasTattooOrPiercing,
          hasTravelledRecently: formData.hasTravelledRecently
        };
      }

      if (dbUser.role === 'hospital') {
        payload.hospitalData = {
          hospitalName: formData.hospitalName,
          registrationNumber: formData.registrationNumber,
          bedsCount: Number(formData.bedsCount),
          emergencyPhone: formData.emergencyPhone,
          website: formData.website,
          type: formData.hospitalType
        };
      }

      if (dbUser.role === 'organization') {
        payload.orgData = {
          organizationName: formData.organizationName,
          representativeName: formData.representativeName,
          licenseNumber: formData.licenseNumber
        };
      }

      await api.put("/users/profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
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
    <div ref={containerRef} className="max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER SECTION */}
      <div className="animate-enter relative pt-6 pb-8 md:pt-10 md:pb-12 mb-6">
        {/* Decorative Background Blur */}
        <div className="bg-blob absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-red-600/10 blur-[80px] rounded-full -z-10 pointer-events-none opacity-50" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            
            {/* User Profile Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 w-full md:w-auto">
                <div className="relative group shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-900 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-500" />
                    <img 
                        src={clerkUser?.imageUrl} 
                        alt="Profile" 
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#09090b] object-cover shadow-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-zinc-700 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-lg">
                        {dbUser?.role}
                    </div>
                </div>
                
                <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-zinc-400 mt-1 font-medium text-sm sm:text-base break-all">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                    
                    <button 
                        onClick={() => openUserProfile()}
                        className="mt-3 text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 transition-all border border-red-500/20 active:scale-95"
                    >
                        <Shield size={12} /> 
                        Manage Security
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <button 
                ref={saveBtnRef}
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full md:w-auto bg-white hover:bg-zinc-200 text-black px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base group"
            >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="group-hover:rotate-12 transition-transform duration-300"/>}
                Save Changes
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        
        {/* --- PERSONAL INFO CARD --- */}
        <section className="animate-enter bg-zinc-900/40 border border-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl overflow-hidden shadow-xl transition-transform duration-300 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/50">
          <div className="px-6 py-4 md:px-8 md:py-6 border-b border-white/5 bg-zinc-900/60 flex items-center gap-3">
             <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300 shrink-0">
               <User size={18} />
             </div>
             <h2 className="text-base md:text-lg font-bold text-white">Basic Information</h2>
          </div>
          
          <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
             <InputGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
             <InputGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
             <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone size={14}/>} />
             
             {/* Location Sub-grid */}
             <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                   <MapPin size={12}/> Location
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none transition-all duration-300 hover:border-zinc-700" />
                    <input name="state" placeholder="State" value={formData.state} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none transition-all duration-300 hover:border-zinc-700" />
                </div>
             </div>
             <InputGroup label="Full Address" name="address" value={formData.address} onChange={handleChange} className="md:col-span-2" />
             <div className="md:col-span-1">
                 <InputGroup label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
             </div>
          </div>
        </section>

        {/* --- ROLE SPECIFIC CARDS --- */}

        {/* DONOR */}
        {dbUser?.role === 'donor' && (
          <section className="animate-enter bg-zinc-900/40 border border-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl overflow-hidden shadow-xl transition-transform duration-300 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/50">
            <div className="px-6 py-4 md:px-8 md:py-6 border-b border-white/5 bg-zinc-900/60 flex items-center gap-3">
              <div className="p-2 bg-red-900/30 text-red-500 rounded-lg shrink-0">
                <Activity size={18} />
              </div>
              <h2 className="text-base md:text-lg font-bold text-white">Medical Profile</h2>
            </div>

            <div className="p-5 md:p-8 space-y-6 md:space-y-8">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <SelectGroup label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                  <SelectGroup label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["male", "female", "other"]} />
                  <InputGroup label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} />
                  <InputGroup label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Stethoscope size={14}/> Health Conditions</label>
                    <textarea 
                      name="healthConditions" 
                      value={formData.healthConditions} 
                      onChange={handleChange}
                      placeholder="E.g. Asthma, Diabetes (Separate with comma)"
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none h-24 md:h-32 resize-none transition-all duration-300 hover:border-zinc-700"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Stethoscope size={14}/> Medications</label>
                    <textarea 
                      name="medications" 
                      value={formData.medications} 
                      onChange={handleChange}
                      placeholder="List any current medications..."
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none h-24 md:h-32 resize-none transition-all duration-300 hover:border-zinc-700"
                    />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <ToggleCard 
                    label="Available" 
                    subLabel="For Donation"
                    name="isAvailable" 
                    checked={formData.isAvailable} 
                    onChange={handleChange} 
                    icon={<Activity size={18}/>} 
                  />
                  <ToggleCard 
                    label="Tattoos / Piercings" 
                    subLabel="Last 6 months"
                    name="hasTattooOrPiercing" 
                    checked={formData.hasTattooOrPiercing} 
                    onChange={handleChange} 
                    icon={<Syringe size={18}/>} 
                    alertMode
                  />
                  <ToggleCard 
                    label="Recent Travel" 
                    subLabel="Abroad"
                    name="hasTravelledRecently" 
                    checked={formData.hasTravelledRecently} 
                    onChange={handleChange} 
                    icon={<Plane size={18}/>} 
                    alertMode
                  />
               </div>
            </div>
          </section>
        )}

        {/* HOSPITAL */}
        {dbUser?.role === 'hospital' && (
           <section className="animate-enter bg-zinc-900/40 border border-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl overflow-hidden shadow-xl transition-transform duration-300 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/50">
             <div className="px-6 py-4 md:px-8 md:py-6 border-b border-white/5 bg-zinc-900/60 flex items-center gap-3">
               <div className="p-2 bg-blue-900/30 text-blue-500 rounded-lg shrink-0">
                 <Building2 size={18} />
               </div>
               <h2 className="text-base md:text-lg font-bold text-white">Hospital Details</h2>
             </div>
             
             <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                <InputGroup label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} className="md:col-span-2" />
                <InputGroup label="Registration / GST" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} icon={<Hash size={14}/>}/>
                <SelectGroup label="Type" name="hospitalType" value={formData.hospitalType} onChange={handleChange} options={["government", "private", "ngo"]} />
                <InputGroup label="Total Beds" name="bedsCount" type="number" value={formData.bedsCount} onChange={handleChange} />
                <InputGroup label="Emergency Phone" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} icon={<Phone size={14}/>} />
                <InputGroup label="Website" name="website" value={formData.website} onChange={handleChange} className="md:col-span-2" icon={<Globe size={14}/>} />
             </div>
           </section>
        )}

        {/* ORGANIZATION */}
        {dbUser?.role === 'organization' && (
           <section className="animate-enter bg-zinc-900/40 border border-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl overflow-hidden shadow-xl transition-transform duration-300 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/50">
             <div className="px-6 py-4 md:px-8 md:py-6 border-b border-white/5 bg-zinc-900/60 flex items-center gap-3">
               <div className="p-2 bg-purple-900/30 text-purple-500 rounded-lg shrink-0">
                 <Building2 size={18} />
               </div>
               <h2 className="text-base md:text-lg font-bold text-white">Organization Info</h2>
             </div>
             <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                <InputGroup label="Org Name" name="organizationName" value={formData.organizationName} onChange={handleChange} className="md:col-span-2" />
                <InputGroup label="Representative Name" name="representativeName" value={formData.representativeName} onChange={handleChange} />
                <InputGroup label="License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} icon={<Hash size={14}/>} />
             </div>
           </section>
        )}
      </form>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const InputGroup = ({ label, name, value, onChange, className = "", type = "text", icon }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
       {icon} {label}
    </label>
    <div className="relative group">
        <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all duration-300 placeholder-zinc-700 hover:border-zinc-700"
        />
        {/* Subtle glow on hover/focus */}
        <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
    </div>
  </div>
);

const SelectGroup = ({ label, name, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
        <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 capitalize transition-all duration-300 hover:border-zinc-700"
        >
            <option value="" className="bg-zinc-900 text-zinc-500">Select</option>
            {options.map(o => <option key={o} value={o} className="bg-zinc-900">{o}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    </div>
  </div>
);

const ToggleCard = ({ label, subLabel, name, checked, onChange, icon, alertMode }) => {
    const activeColor = alertMode 
        ? "bg-amber-900/20 border-amber-600/50 text-amber-500" 
        : "bg-green-900/20 border-green-600/50 text-green-500";
    
    const inactiveColor = "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900";

    return (
        <label className={`
            relative flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border cursor-pointer transition-all duration-300 group
            ${checked ? activeColor : inactiveColor}
            active:scale-[0.98]
        `}>
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <div className={`p-2 rounded-full shrink-0 transition-colors duration-300 ${checked ? (alertMode ? 'bg-amber-500/20' : 'bg-green-500/20') : 'bg-zinc-800'}`}>
                    {icon}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={`font-bold text-xs md:text-sm truncate ${checked ? 'text-white' : 'text-zinc-400'}`}>{label}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70 truncate">{subLabel}</span>
                </div>
            </div>
            
            <div className={`
                w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0
                ${checked 
                    ? (alertMode ? 'border-amber-500 bg-amber-500 scale-110' : 'border-green-500 bg-green-500 scale-110') 
                    : 'border-zinc-600 group-hover:border-zinc-500'}
            `}>
                {checked && (
                    alertMode 
                    ? <AlertCircle size={12} className="text-black" strokeWidth={3} />
                    : <CheckCircle2 size={12} className="text-black" strokeWidth={3} />
                )}
            </div>

            <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
        </label>
    );
}

export default Settings;