
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { 
  ArrowLeft, 
  Siren, 
  User, 
  Activity, 
  MapPin, 
  Droplet, 
  Zap, 
  Radio,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  XCircle,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';

const CreateRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  // History State
  const [requests, setRequests] = useState({ active: [], past: [] });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      urgency: "moderate",
      unitsNeeded: 1,
      bloodGroup: "",
    },
  });

  const selectedUrgency = watch("urgency");
  const selectedBloodGroup = watch("bloodGroup");

  useEffect(() => {
    if (user?.location?.coordinates) {
      // Location is ready
    } else {
      toast.error("Please update your Hospital Profile with a location first!");
      navigate("/hospital/dashboard");
    }
  }, [user, navigate]);

  // Fetch History
  const fetchRequests = async () => {
      try {
          const token = await getToken();
          const res = await api.get('/requests/hospital', {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
              const all = res.data.data;
              const active = all.filter(r => ['pending', 'accepted'].includes(r.status));
              const past = all.filter(r => ['fulfilled', 'cancelled', 'expired'].includes(r.status));
              setRequests({ active, past });
          }
      } catch (error) {
          console.error("Failed to fetch history", error);
      } finally {
          setLoadingHistory(false);
      }
  };

  useEffect(() => {
      fetchRequests();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setIsBroadcasting(true);

    try {
      const token = await getToken();
      const payload = {
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        unitsNeeded: Number(data.unitsNeeded),
        urgency: data.urgency,
        location: {
          type: "Point",
          coordinates: user.location.coordinates, 
        },
      };

      await new Promise(r => setTimeout(r, 2000)); 

      const res = await api.post("/requests", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Request Broadcasted Successfully!");
        // Refresh history instead of navigating away immediately, or navigate user choice
        // For now, let's keep user here to see it in "Active" list
        fetchRequests();
        reset(); // Clear form
        setIsBroadcasting(false); // Stop overlay
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to create request";
      toast.error(msg);
      setIsBroadcasting(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative font-sans pb-20">
        
      {/* BACKGROUND FX */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-blue-900/5 blur-[100px] rounded-full pointer-events-none" />

      {/* --- BROADCASTING OVERLAY --- */}
      <AnimatePresence>
        {isBroadcasting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6"
          >
             {/* Radar Animation */}
             <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                <div className="absolute inset-0 border border-red-500/30 rounded-full animate-ping [animation-duration:2s]" />
                <div className="absolute inset-0 border border-red-500/20 rounded-full animate-ping [animation-duration:2s] [animation-delay:0.5s]" />
                <div className="absolute inset-0 border border-red-500/10 rounded-full animate-ping [animation-duration:2s] [animation-delay:1s]" />
                <div className="relative z-10 bg-gradient-to-br from-red-600 to-red-800 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50">
                    <Radio size={40} className="text-white animate-pulse" />
                </div>
             </div>
             
             <h2 className="text-3xl font-bold text-white mb-2">Broadcasting Alert</h2>
             <p className="text-zinc-400">Notifying eligible donors within 10km radius...</p>
             
             <div className="mt-8 flex items-center gap-2 text-red-500 font-mono text-sm">
                <Activity size={16} className="animate-spin" /> 
                SEARCHING NETWORK...
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1600px] mx-auto py-8 px-4 md:px-8 relative z-10">
        
        {/* NAV HEAD */}
        <div className="flex items-center justify-between mb-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-zinc-400 hover:text-white transition-colors group"
            >
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-all mr-3">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-500 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> 
                COMMAND CENTER
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT: FORM INPUTS (Width 7/12 on large screens) */}
            <div className="xl:col-span-7 space-y-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                    Broadcast <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">Blood Request</span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    Instantly notify nearby donors. Precision saves lives.
                  </p>
                </div>

                {/* FORM CONTAINER */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
                        {/* SECTION 1: PATIENT */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Patient Details</label>
                            
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-red-500/50 focus-within:border-red-500/50 transition-all">
                                <div className="flex items-center px-4">
                                    <User className="text-zinc-500" />
                                    <input
                                        {...register("patientName", { required: "Patient Name is required" })}
                                        className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-zinc-600 font-medium"
                                        placeholder="Patient Full Name"
                                    />
                                </div>
                            </div>
                            {errors.patientName && <p className="text-red-500 text-sm ml-1">{errors.patientName.message}</p>}
                        </div>

                        {/* SECTION 2: SPECIFICS (Blood & Units) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Blood Group */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Blood Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                        <label key={bg} className="relative cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                value={bg} 
                                                {...register("bloodGroup", { required: true })} 
                                                className="peer sr-only" 
                                            />
                                            <div className="h-14 rounded-xl border-2 border-zinc-800 bg-zinc-900/50 flex items-center justify-center font-bold text-zinc-400 peer-checked:border-red-600 peer-checked:bg-red-600 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-red-900/40 transition-all hover:bg-zinc-800">
                                                {bg}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.bloodGroup && <p className="text-red-500 text-sm ml-1">Please select a blood group</p>}
                            </div>

                            {/* Units Slider */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Units Required</label>
                                <div className="h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Droplet size={100} />
                                    </div>
                                    <div className="flex items-baseline gap-1 text-5xl font-black text-white z-10">
                                        {watch("unitsNeeded")}
                                        <span className="text-lg font-medium text-zinc-500">Units</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        step="1"
                                        {...register("unitsNeeded")}
                                        className="w-full mt-6 accent-red-600 cursor-pointer" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: URGENCY */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Urgency Level</label>
                            <div className="grid grid-cols-3 gap-4">
                                {/* LOW */}
                                <label className="cursor-pointer relative group">
                                    <input type="radio" value="low" {...register("urgency")} className="peer sr-only" />
                                    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center gap-3 transition-all peer-checked:border-green-500 peer-checked:bg-green-500/10 group-hover:bg-zinc-800">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold text-white">Low</span>
                                            <span className="text-xs text-zinc-500">Routine</span>
                                        </div>
                                    </div>
                                </label>

                                {/* MODERATE */}
                                <label className="cursor-pointer relative group">
                                    <input type="radio" value="moderate" {...register("urgency")} className="peer sr-only" />
                                    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center gap-3 transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500/10 group-hover:bg-zinc-800">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                            <Activity size={18} />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold text-white">Moderate</span>
                                            <span className="text-xs text-zinc-500">Urgent</span>
                                        </div>
                                    </div>
                                </label>

                                {/* CRITICAL */}
                                <label className="cursor-pointer relative group">
                                    <input type="radio" value="critical" {...register("urgency")} className="peer sr-only" />
                                    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center gap-3 transition-all peer-checked:border-red-600 peer-checked:bg-red-600/10 shadow-[0_0_0_0_rgba(220,38,38,0)] peer-checked:shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center relative">
                                            <AlertTriangle size={18} />
                                            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-0 group-has-[:checked]:opacity-100" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold text-white group-has-[:checked]:text-red-500">Critical</span>
                                            <span className="text-xs text-zinc-500">Immediate</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:to-red-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-red-900/30 transition-all active:scale-[0.98]"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <Siren className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="text-lg">{isLoading ? "CONTACTING DONORS..." : "BROADCAST EMERGENCY REQUEST"}</span>
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: HISTORY & PREVIEW (Width 5/12 on large screens) */}
            <div className="xl:col-span-5 space-y-6 flex flex-col">
                
                {/* PREVIEW CARD */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4">Request Preview</h3>
                    <div className="bg-black border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-600 flex items-center justify-center">
                                    <Droplet size={16} fill="currentColor" />
                                </div>
                                <span className="font-bold text-sm text-white">{selectedBloodGroup || 'AB+'} Request</span>
                             </div>
                             <span className="text-[10px] text-zinc-500">Just Now</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                            {user?.hospitalProfile?.hospitalName || 'City Hospital'} is requesting <span className="text-white font-bold">{watch("unitsNeeded")} Units</span> of <span className="text-white font-bold">{selectedBloodGroup || 'AB+'}</span> blood for a patient.
                        </p>
                    </div>
                </div>

                {/* HISTORY SECTION */}
                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="text-white font-bold flex items-center gap-2">
                             <History size={18} className="text-zinc-400" /> Request Log
                         </h3>
                         
                         <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                             <button 
                                onClick={() => setActiveTab('active')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all relative ${activeTab === 'active' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                             >
                                 {activeTab === 'active' && (
                                     <motion.div 
                                        layoutId="tab-pill"
                                        className="absolute inset-0 bg-zinc-800 rounded-md"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                     />
                                 )}
                                 <span className="relative z-10">Active</span>
                             </button>
                             <button 
                                onClick={() => setActiveTab('past')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all relative ${activeTab === 'past' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                             >
                                 {activeTab === 'past' && (
                                     <motion.div 
                                        layoutId="tab-pill"
                                        className="absolute inset-0 bg-zinc-800 rounded-md"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                     />
                                 )}
                                 <span className="relative z-10">History</span>
                             </button>
                         </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                        {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center h-48 space-y-3">
                                <Clock className="animate-spin text-zinc-600" size={24} />
                                <span className="text-xs text-zinc-500">Loading history...</span>
                            </div>
                        ) : (
                            requests[activeTab].length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center h-48 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl"
                                >
                                    <History size={32} className="opacity-20 mb-2" />
                                    <p className="text-xs">No {activeTab} requests found.</p>
                                </motion.div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {requests[activeTab].map((req) => (
                                        <motion.div 
                                            key={req._id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                         req.urgency === 'critical' ? 'bg-red-500/20 text-red-500' :
                                                         req.urgency === 'moderate' ? 'bg-orange-500/20 text-orange-500' :
                                                         'bg-green-500/20 text-green-500'
                                                     }`}>
                                                         {req.bloodGroup}
                                                     </div>
                                                     <div>
                                                         <p className="text-white font-bold text-sm">{req.patientName}</p>
                                                         <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                             <Clock size={10} /> {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                                         </p>
                                                     </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    req.status === 'accepted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                    req.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                                    req.status === 'fulfilled' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                }`}>
                                                    {req.status === 'accepted' ? 'Incoming' : req.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-900">
                                                <span>{req.unitsNeeded} Unit(s)</span>
                                                {req.acceptedBy?.length > 0 && (
                                                    <span className="text-blue-500 font-bold">{req.acceptedBy.length} Donor(s) found</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )
                        )}
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;