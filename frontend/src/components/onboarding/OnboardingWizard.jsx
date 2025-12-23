import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, MapPin, Activity, Building2, 
  Calendar, CheckCircle2, ShieldAlert, HeartPulse, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingWizard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { onboard } = useAuthStore();
  const navigate = useNavigate();
  
  // Determine Role from Clerk Metadata
  const role = user?.unsafeMetadata?.role || 'donor';

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Fetch Token on Mount
  useEffect(() => {
    const fetchToken = async () => {
      const t = await getToken();
      setToken(t);
    };
    fetchToken();
  }, [getToken]);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    // Step 1: Identity
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    
    // Step 2: Location
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // Step 3: Role Specific
    // Donor
    bloodGroup: '',
    dob: '',
    weight: '',
    gender: '',
    healthConditions: [], // Multi-select logic needed? Keeping simple for now
    
    // Hospital
    hospitalName: user?.unsafeMetadata?.hospitalName || '',
    type: 'private',
    registrationNumber: '',
    
    // Organization
    organizationName: user?.unsafeMetadata?.organizationName || '',
    accountType: 'permanent',
    expiryDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- SUBMISSION LOGIC ---
  const handleSubmit = async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      // Construct Backend Payload
      const payload = {
        role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coordinates: { lat: 0, lng: 0 } // Placeholder for GeoAPI
        },
        // Conditional Sub-Documents
        donorData: role === 'donor' ? {
          bloodGroup: formData.bloodGroup,
          dob: formData.dob,
          weight: Number(formData.weight),
          gender: formData.gender,
          healthConditions: formData.healthConditions // Array
        } : undefined,
        hospitalData: role === 'hospital' ? {
          hospitalName: formData.hospitalName,
          type: formData.type,
          registrationNumber: formData.registrationNumber
        } : undefined,
        orgData: role === 'organization' ? {
          organizationName: formData.organizationName,
          accountType: formData.accountType,
          expiryDate: formData.expiryDate
        } : undefined
      };

      await onboard(payload, token);
      toast.success("Welcome to RedGrid!");
      
      // Redirect based on role
      if (role === 'hospital') navigate('/hospital/dashboard');
      else if (role === 'organization') navigate('/org/dashboard');
      else navigate('/donor/dashboard');

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Setup failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DYNAMIC SVG ILLUSTRATIONS ---
  const getIllustration = () => {
    if (step === 1) return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (8).svg"; // Doctor/Identity
    if (step === 2) return "/undraw_map-dark_g9xq.svg"; // Map
    if (step === 3) return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (12).svg"; // Medical/Final
    return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (1).svg";
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-black flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      {/* Background Blobs for Aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDE: VISUAL & STEPS */}
        <div className="w-full md:w-1/3 bg-gray-50 dark:bg-zinc-950 p-8 flex flex-col justify-between border-r border-gray-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
              <span className="font-bold text-xl dark:text-white">RedGrid Setup</span>
            </div>

            {/* Stepper */}
            <div className="space-y-6">
              <StepIndicator num={1} title="Identity" active={step === 1} completed={step > 1} />
              <StepIndicator num={2} title="Location" active={step === 2} completed={step > 2} />
              <StepIndicator num={3} title={role === 'donor' ? 'Health' : 'Verification'} active={step === 3} completed={step > 3} />
            </div>
          </div>

          {/* Dynamic Illustration */}
          <div className="flex-1 flex items-center justify-center p-4">
             <img 
               src={getIllustration()} 
               alt="Step Illustration" 
               className="w-full max-h-60 object-contain drop-shadow-xl transition-all duration-500" 
             />
          </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto relative">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {step === 1 && "Let's get to know you."}
              {step === 2 && "Where are you located?"}
              {step === 3 && role === 'donor' && "Medical Profile"}
              {step === 3 && role !== 'donor' && "Professional Details"}
            </h2>
            <p className="text-gray-500">
              Please fill in the details accurately. This helps us save lives faster.
            </p>
          </div>

          {/* --- STEP 1: IDENTITY --- */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-5">
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 99999 00000" />
            </div>
          )}

          {/* --- STEP 2: LOCATION --- */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Input label="Street Address" name="address" value={formData.address} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-5">
                <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                <Input label="State" name="state" value={formData.state} onChange={handleChange} />
              </div>
              <Input label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 text-blue-700 dark:text-blue-300 text-sm">
                 <MapPin className="shrink-0" />
                 <p>Your location allows us to connect you with nearby blood requests and donation camps.</p>
              </div>
            </div>
          )}

          {/* --- STEP 3: ROLE SPECIFIC --- */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* DONOR FORM */}
              {role === 'donor' && (
                <>
                  <div className="grid grid-cols-2 gap-5">
                    <Select label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} 
                        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} 
                    />
                    <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} 
                        options={['male', 'female', 'other']} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                    <Input label="Weight (kg)" type="number" name="weight" value={formData.weight} onChange={handleChange} />
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl flex gap-3 text-red-700 dark:text-red-300 text-sm mt-4">
                     <ShieldAlert className="shrink-0" />
                     <p>I confirm that I do not have any major communicable diseases and I am eligible to donate.</p>
                  </div>
                </>
              )}

              {/* HOSPITAL FORM */}
              {role === 'hospital' && (
                <>
                   <Input label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} />
                   <Input label="Registration / License No." name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
                   <Select label="Hospital Type" name="type" value={formData.type} onChange={handleChange} 
                      options={['government', 'private', 'ngo']} 
                   />
                </>
              )}

              {/* ORG FORM (TIME BOMB) */}
              {role === 'organization' && (
                <>
                   <Input label="Organization Name" name="organizationName" value={formData.organizationName} onChange={handleChange} />
                   <Select label="Account Type" name="accountType" value={formData.accountType} onChange={handleChange} 
                      options={['permanent', 'temporary']} 
                   />
                   
                   {formData.accountType === 'temporary' && (
                      <div className="border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30 p-4 rounded-xl space-y-3">
                         <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm uppercase">
                            <Calendar size={16} /> Event Expiry
                         </div>
                         <Input 
                            type="date" 
                            name="expiryDate" 
                            value={formData.expiryDate} 
                            onChange={handleChange} 
                            label="Auto-Deletion Date"
                         />
                         <p className="text-xs text-orange-600/80">
                            Your account and all associated data will be permanently deleted after this date.
                         </p>
                      </div>
                   )}
                </>
              )}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100 dark:border-zinc-800">
            <button 
               onClick={() => setStep(s => Math.max(1, s - 1))}
               disabled={step === 1}
               className={`flex items-center gap-2 text-sm font-semibold transition-colors
                 ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
            >
               <ArrowLeft size={16} /> Back
            </button>

            {step < 3 ? (
               <button 
                 onClick={() => setStep(s => s + 1)}
                 className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
               >
                 Next Step <ArrowRight size={18} />
               </button>
            ) : (
               <button 
                 onClick={handleSubmit}
                 disabled={isLoading}
                 className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:scale-105 transition-transform"
               >
                 {isLoading ? <Loader2 className="animate-spin" /> : <> Complete Setup <CheckCircle2 size={18} /> </>}
               </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS for Clean Code ---

const StepIndicator = ({ num, title, active, completed }) => (
  <div className="flex items-center gap-4">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
      ${active ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-110' : 
        completed ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>
      {completed ? <CheckCircle2 size={16} /> : num}
    </div>
    <div className={`text-sm font-medium transition-colors ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
      {title}
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">{label}</label>
    <input 
      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none transition-all dark:text-white placeholder:text-gray-400" 
      {...props} 
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">{label}</label>
    <div className="relative">
        <select 
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none transition-all dark:text-white appearance-none capitalize" 
        {...props}
        >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
    </div>
  </div>
);

export default OnboardingWizard;