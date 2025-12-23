import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, MapPin, Activity, Building2, 
  Calendar, CheckCircle2, ShieldAlert, Loader2, User, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingWizard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { onboard } = useAuthStore();
  const navigate = useNavigate();
  
  const role = user?.unsafeMetadata?.role || 'donor';

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 3;

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bloodGroup: '',
    dob: '',
    weight: '',
    gender: '',
    healthConditions: [],
    hospitalName: user?.unsafeMetadata?.hospitalName || '',
    type: 'private',
    registrationNumber: '',
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
    setIsLoading(true);

    try {
      const token = await getToken(); 
      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

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
          coordinates: { lat: 0, lng: 0 }
        },
        donorData: role === 'donor' ? {
          bloodGroup: formData.bloodGroup,
          dob: formData.dob,
          weight: Number(formData.weight),
          gender: formData.gender,
          healthConditions: formData.healthConditions
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

  // --- UI HELPERS ---
  const nextStep = () => setStep(s => Math.min(totalSteps, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));
  const progress = (step / totalSteps) * 100;

  const getIllustration = () => {
    if (step === 1) return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (8).svg"; 
    if (step === 2) return "/undraw_map-dark_g9xq.svg"; 
    if (step === 3) return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (12).svg"; 
    return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (1).svg";
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* === LEFT PANEL (Desktop Only - Visuals) === */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 relative flex-col justify-between p-12 border-r border-zinc-800">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
             <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-900/50">R</div>
                <span className="text-2xl font-bold text-white tracking-tight">RedGrid</span>
            </div>
            
            <div className="space-y-8">
                <StepItem num={1} title="Identity" desc="Tell us who you are" active={step === 1} completed={step > 1} />
                <StepItem num={2} title="Location" desc="Where can we find you?" active={step === 2} completed={step > 2} />
                <StepItem num={3} title="Profile Details" desc={role === 'donor' ? 'Medical history' : 'Professional info'} active={step === 3} completed={step > 3} />
            </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
             <img src={getIllustration()} alt="Illustration" className="w-full max-w-sm h-64 object-contain drop-shadow-2xl transition-all duration-700 ease-in-out transform hover:scale-105" />
             <p className="text-zinc-500 text-sm mt-8 text-center max-w-xs">
                "Connecting donors, hospitals, and organizations to save lives faster."
             </p>
        </div>
      </div>

      {/* === RIGHT PANEL (Form Area) === */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative">
        
        {/* Mobile Header (Progress Bar) */}
        <div className="lg:hidden p-6 pb-2 bg-white dark:bg-black sticky top-0 z-20">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevStep} disabled={step === 1} className="p-2 -ml-2 text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-0">
                    <ArrowLeft size={24} />
                </button>
                <span className="text-sm font-semibold text-zinc-500">Step {step} of {totalSteps}</span>
            </div>
            {/* Progress Line */}
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-20 scroll-smooth">
          <div className="max-w-2xl mx-auto space-y-8 pb-24 lg:pb-0">
            
            {/* Dynamic Title */}
            <div className="space-y-2 animate-in slide-in-from-left-4 duration-500">
                <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    {step === 1 && "Let's start with the basics."}
                    {step === 2 && "Where are you located?"}
                    {step === 3 && (role === 'donor' ? "Medical Profile" : "Professional Details")}
                </h1>
                <p className="text-zinc-500 text-lg">
                    {step === 1 && "We need a few details to set up your profile."}
                    {step === 2 && "This helps us connect you with nearby requests."}
                    {step === 3 && "Final step to verify your eligibility."}
                </p>
            </div>

            {/* --- STEP 1: IDENTITY --- */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                        <FloatingInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} icon={<User size={18}/>} />
                        <FloatingInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </div>
                    <FloatingInput label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                </div>
            )}

            {/* --- STEP 2: LOCATION --- */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <FloatingInput label="Street Address" name="address" value={formData.address} onChange={handleChange} icon={<MapPin size={18}/>} />
                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                        <FloatingInput label="City" name="city" value={formData.city} onChange={handleChange} />
                        <FloatingInput label="State" name="state" value={formData.state} onChange={handleChange} />
                    </div>
                    <FloatingInput label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex gap-3 text-blue-700 dark:text-blue-300 text-sm">
                        <MapPin className="shrink-0 mt-0.5" size={16} />
                        <p>We use this to show you relevant blood requests within your area.</p>
                    </div>
                </div>
            )}

            {/* --- STEP 3: ROLE SPECIFIC --- */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    
                    {/* DONOR */}
                    {role === 'donor' && (
                        <>
                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <SelectInput label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} 
                                    options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} 
                                />
                                <SelectInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} 
                                    options={['male', 'female', 'other']} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                                <FloatingInput label="Weight (kg)" type="number" name="weight" value={formData.weight} onChange={handleChange} />
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex gap-3 text-red-700 dark:text-red-300 text-sm">
                                <ShieldAlert className="shrink-0 mt-0.5" size={16} />
                                <p>I confirm that I do not have any major communicable diseases.</p>
                            </div>
                        </>
                    )}

                    {/* HOSPITAL */}
                    {role === 'hospital' && (
                        <>
                            <FloatingInput label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} icon={<Building2 size={18}/>} />
                            <FloatingInput label="Registration / License No." name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
                            <SelectInput label="Hospital Type" name="type" value={formData.type} onChange={handleChange} 
                                options={['government', 'private', 'ngo']} 
                            />
                        </>
                    )}

                    {/* ORGANIZATION */}
                    {role === 'organization' && (
                        <>
                            <FloatingInput label="Organization Name" name="organizationName" value={formData.organizationName} onChange={handleChange} icon={<Building2 size={18}/>} />
                            <SelectInput label="Account Type" name="accountType" value={formData.accountType} onChange={handleChange} 
                                options={['permanent', 'temporary']} 
                            />
                            {formData.accountType === 'temporary' && (
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-xs uppercase">
                                        <Calendar size={14} /> Event Expiry
                                    </div>
                                    <input 
                                        type="date" 
                                        name="expiryDate" 
                                        value={formData.expiryDate} 
                                        onChange={handleChange} 
                                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                    <p className="text-xs text-orange-600/80">Account auto-deletes after this date.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

          </div>
        </div>

        {/* Bottom Actions Bar (Sticky on Mobile, Fixed on Desktop) */}
        <div className="p-6 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800 lg:static fixed bottom-0 left-0 right-0 z-30">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
                {/* Back Button (Desktop Only) */}
                <button 
                    onClick={prevStep} 
                    disabled={step === 1}
                    className="hidden lg:flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors disabled:opacity-0"
                >
                    <ArrowLeft size={18} /> Back
                </button>

                {/* Main Action Button */}
                <button 
                    onClick={step < totalSteps ? nextStep : handleSubmit}
                    disabled={isLoading}
                    className="w-full lg:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-zinc-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 
                        step < totalSteps ? <>Continue <ArrowRight size={20} /></> : <>Complete Setup <CheckCircle2 size={20} /></>
                    }
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

// --- MODERN UI COMPONENTS ---

const StepItem = ({ num, title, desc, active, completed }) => (
    <div className="flex gap-4 group">
        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all duration-300
            ${active ? 'border-red-600 bg-red-600 text-white scale-110 shadow-lg shadow-red-900/20' : 
              completed ? 'border-green-500 bg-green-500 text-white' : 'border-zinc-700 text-zinc-500'}`}>
            {completed ? <CheckCircle2 size={24} /> : num}
        </div>
        <div className={`flex flex-col justify-center transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-50'}`}>
            <h4 className="text-white font-semibold text-lg leading-tight">{title}</h4>
            <p className="text-zinc-400 text-sm">{desc}</p>
        </div>
    </div>
);

const FloatingInput = ({ label, icon, ...props }) => (
    <div className="relative group">
        <div className="absolute top-4 left-4 text-zinc-400 group-focus-within:text-red-500 transition-colors">
            {icon}
        </div>
        <input 
            className={`peer w-full bg-zinc-50 dark:bg-zinc-900/50 border-2 border-transparent dark:border-zinc-800 rounded-xl px-4 py-4 ${icon ? 'pl-12' : 'pl-4'} pt-6 pb-2 font-medium text-zinc-900 dark:text-white placeholder-transparent focus:bg-white dark:focus:bg-black focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-sm`}
            placeholder={label}
            {...props}
        />
        <label className={`absolute left-4 ${icon ? 'left-12' : 'left-4'} top-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-1.5 peer-focus:text-xs peer-focus:font-bold peer-focus:text-red-500 peer-focus:uppercase`}>
            {label}
        </label>
    </div>
);

const SelectInput = ({ label, options, ...props }) => (
    <div className="relative group">
        <label className="absolute left-4 top-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider z-10 pointer-events-none group-focus-within:text-red-500">
            {label}
        </label>
        <div className="relative">
            <select 
                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border-2 border-transparent dark:border-zinc-800 rounded-xl px-4 py-4 pt-6 pb-2 font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all capitalize shadow-sm cursor-pointer"
                {...props}
            >
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 group-focus-within:text-red-500">
                <ChevronRight className="rotate-90" size={20} />
            </div>
        </div>
    </div>
);

export default OnboardingWizard;