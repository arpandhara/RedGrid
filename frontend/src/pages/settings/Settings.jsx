import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axios";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react"; //
import { 
  Save, Loader2, User, Activity, 
  Building2, Stethoscope, Syringe, Plane, Shield
} from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { user: dbUser, checkUser } = useAuthStore();
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const { getToken } = useAuth(); // 1. Get getToken hook
  
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      // 2. Get the Token securely
      const token = await getToken();
      
      // Construct Payload based on Role
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

      // 3. Send Request WITH HEADERS
      await api.put("/users/profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh User Data
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
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-zinc-800">
        <div className="flex items-center gap-6">
           <div className="relative">
             <img 
               src={clerkUser?.imageUrl} 
               alt="Profile" 
               className="w-24 h-24 rounded-2xl border-2 border-zinc-800 object-cover"
             />
             <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-zinc-700 text-white text-xs px-2 py-1 rounded-full uppercase font-bold">
               {dbUser?.role}
             </div>
           </div>
           <div>
             <h1 className="text-3xl font-bold text-white">Settings</h1>
             <p className="text-zinc-500 mt-1">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
             <button 
               onClick={() => openUserProfile()}
               className="mt-3 text-xs font-bold text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 transition-all"
             >
               <Shield size={12} /> Manage Password & Security (Clerk)
             </button>
           </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Changes
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">
        
        {/* PERSONAL INFO */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="text-red-600" size={24} /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
            <InputGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
            <InputGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
            <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Location</label>
               <div className="grid grid-cols-2 gap-2">
                 <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none" />
                 <input name="state" placeholder="State" value={formData.state} onChange={handleChange} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none" />
               </div>
               <input name="address" placeholder="Full Address" value={formData.address} onChange={handleChange} className="w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none" />
            </div>
          </div>
        </section>

        {/* DONOR FIELDS */}
        {dbUser?.role === 'donor' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-red-600" size={24} /> Medical Profile
            </h2>
            <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-6">
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SelectGroup label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                  <SelectGroup label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["male", "female", "other"]} />
                  <InputGroup label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} />
                  <InputGroup label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Stethoscope size={14}/> Health Conditions</label>
                    <textarea 
                      name="healthConditions" 
                      value={formData.healthConditions} 
                      onChange={handleChange}
                      placeholder="E.g. Asthma, Diabetes (Separate with comma)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none h-24 resize-none"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Stethoscope size={14}/> Medications</label>
                    <textarea 
                      name="medications" 
                      value={formData.medications} 
                      onChange={handleChange}
                      placeholder="Current medications..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none h-24 resize-none"
                    />
                 </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-zinc-800">
                  <Toggle label="Available for Donation" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} icon={<Activity size={18}/>} />
                  <Toggle label="Recent Tattoos/Piercings" name="hasTattooOrPiercing" checked={formData.hasTattooOrPiercing} onChange={handleChange} icon={<Syringe size={18}/>} />
                  <Toggle label="Recent Travel (Abroad)" name="hasTravelledRecently" checked={formData.hasTravelledRecently} onChange={handleChange} icon={<Plane size={18}/>} />
               </div>
            </div>
          </section>
        )}

        {/* HOSPITAL FIELDS */}
        {dbUser?.role === 'hospital' && (
           <section className="space-y-4">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Building2 className="text-red-600" size={24} /> Hospital Details
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <InputGroup label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} className="md:col-span-2" />
                <InputGroup label="Registration / GST" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
                <SelectGroup label="Type" name="hospitalType" value={formData.hospitalType} onChange={handleChange} options={["government", "private", "ngo"]} />
                <InputGroup label="Total Beds" name="bedsCount" type="number" value={formData.bedsCount} onChange={handleChange} />
                <InputGroup label="Emergency Phone" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} />
                <InputGroup label="Website" name="website" value={formData.website} onChange={handleChange} className="md:col-span-2" />
             </div>
           </section>
        )}

        {/* ORG FIELDS */}
        {dbUser?.role === 'organization' && (
           <section className="space-y-4">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Building2 className="text-red-600" size={24} /> Organization Info
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <InputGroup label="Org Name" name="organizationName" value={formData.organizationName} onChange={handleChange} className="md:col-span-2" />
                <InputGroup label="Representative Name" name="representativeName" value={formData.representativeName} onChange={handleChange} />
                <InputGroup label="License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} />
             </div>
           </section>
        )}
      </form>
    </div>
  );
};

// --- HELPER COMPONENTS (Keep these as they were) ---

const InputGroup = ({ label, name, value, onChange, className = "", type = "text" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-zinc-600"
    />
  </div>
);

const SelectGroup = ({ label, name, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-red-600 capitalize"
    >
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Toggle = ({ label, name, checked, onChange, icon }) => (
  <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${checked ? 'bg-red-900/10 border-red-900/30' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
      <div className="flex items-center gap-3">
          <div className={`${checked ? 'text-red-500' : 'text-zinc-500'}`}>{icon}</div>
          <span className={`font-semibold ${checked ? 'text-red-500' : 'text-zinc-400'}`}>{label}</span>
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="accent-red-600 w-5 h-5" />
  </label>
);

export default Settings;