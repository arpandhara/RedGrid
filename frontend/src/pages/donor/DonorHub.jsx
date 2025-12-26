import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Heart, Droplet, 
    Filter, ArrowRight, Star, ShieldCheck, 
    Navigation, Phone, Mail, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore'; 
import { useSocket } from '../../context/SocketContext'; // Import Socket Context
import { useNavigate, useLocation } from 'react-router-dom';
import RequestModal from '../../components/donor/RequestModal'; 
import { format } from 'date-fns'; 
import { QRCodeSVG } from 'qrcode.react';

const DonorHub = () => {
    const [mode, setMode] = useState('donate'); 
    const { socket } = useSocket(); // Fix: Destructure socket
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState({ city: 'Kolkata', bloodGroup: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState(null); // For Request Modal

    const [opportunities, setOpportunities] = useState([]);
    const [myRequests, setMyRequests] = useState({ incoming: [], outgoing: [], accepted: [] }); // Updated State
    const { user } = useAuthStore(); // Access user for location

    // Fetch Opportunities (Mode 1)
    const fetchFeed = async () => {
        setLoading(true);
        try {
            let params = {};
            
            // 1. Try User Profile Location first (Backend Fallback matches this too, but explicit is better)
            if (user?.location?.coordinates?.length === 2) {
                params.lng = user.location.coordinates[0];
                params.lat = user.location.coordinates[1];
            } 
            
            // Create query string
            const queryString = new URLSearchParams(params).toString();
            const res = await api.get(`/requests/feed?${queryString}`); 
            
            if (res.data.success) {
                setOpportunities(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch My Requests (Mode 3 & 4)
    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/requests/user');
            if (res.data.success) {
                setMyRequests(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch my requests", error);
        } finally {
            setLoading(false);
        }
    };

    // URL Params Handling & Socket Listeners
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const requestId = params.get('requestId');

        if (tab === 'requests') setMode('requests');
        if (requestId) {
             // Logic to auto-open request would go here, for now we just switch tab
             if (tab === 'requests') setMode('requests');
        }

        // Socket Listeners for Real-time Updates
        if (socket) {
            socket.on('request_update', () => {
                if (mode === 'donate') fetchFeed();
                if (mode === 'requests' || mode === 'tickets') fetchMyRequests();
            });

            socket.on('new_request_broadcast', () => {
                 if (mode === 'donate') fetchFeed();
            });
            
            socket.on('notification', () => {
                 // specific logic if needed, usually notification component handles toast
                 // But we can refresh requests if we get a notification about it
                 if (mode === 'requests' || mode === 'tickets') fetchMyRequests();
            });
        }

        return () => {
            if (socket) {
                socket.off('request_update');
                socket.off('new_request_broadcast');
                socket.off('notification');
            }
        };
    }, [socket, mode, location.search]);

    // Initial Load & Refresh on Mode Change
    useEffect(() => {
        if (mode === 'donate') fetchFeed();
        if (mode === 'requests' || mode === 'tickets') fetchMyRequests();
    }, [mode]);

    // Search Handler
    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                city: searchQuery.city,
                bloodGroup: searchQuery.bloodGroup
            }).toString();
            
            const res = await api.get(`/search/availability?${params}`);
            
            if (res.data.success) {
                setSearchResults(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pb-32 font-sans selection:bg-red-500/30">
            
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />

            {/* Header & Toggle */}
            <div className="max-w-5xl mx-auto mb-12 sticky top-4 z-40">
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 pr-3 pl-6">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
                           <Heart className="text-red-500 fill-red-500" size={20} /> Donor Hub
                        </h1>
                    </div>

                    {/* Premium Animated Toggle */}
                    <div className="bg-zinc-900/50 p-1.5 rounded-full flex relative w-full md:w-auto min-w-[400px]">
                         <motion.div 
                            className="absolute top-1.5 bottom-1.5 rounded-full bg-zinc-800 shadow-lg border border-white/5"
                            layoutId="activeTab"
                            initial={false}
                            animate={{ 
                                x: mode === 'donate' ? '0%' : mode === 'find' ? '100%' : mode === 'requests' ? '200%' : '300%',
                                width: '25%' 
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                         />
                         {['donate', 'find', 'requests', 'tickets'].map((tab) => (
                             <button 
                                key={tab}
                                onClick={() => setMode(tab)}
                                className={`flex-1 relative z-10 text-xs font-bold py-2.5 px-6 rounded-full text-center transition-all uppercase tracking-wider ${mode === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                             >
                                {tab}
                             </button>
                         ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <AnimatePresence mode="wait">
                    
                    {/* MODE 1: DONATE FEED */}
                    {mode === 'donate' && (
                        <motion.div 
                            key="donate"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {loading && <div className="text-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"/></div>}
                            
                            {!loading && opportunities.length === 0 && (
                                <div className="text-center py-24 bg-zinc-900/30 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                                    <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Heart size={32} className="text-zinc-600" />
                                    </div>
                                    <h3 className="text-zinc-300 font-bold text-lg mb-2">No active requests nearby</h3>
                                    <p className="text-zinc-500 text-sm max-w-xs mx-auto">You are a hero for checking! We will notify you when someone needs help.</p>
                                </div>
                            )}

                            {opportunities.map((opp) => (
                                <div key={opp._id} className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden hover:border-zinc-700 transition-all duration-300 group shadow-2xl shadow-black/50">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Image Section */}
                                        <div className="md:w-2/5 h-56 md:h-auto relative overflow-hidden">
                                            <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
                                            <img 
                                                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" 
                                                alt="Hospital" 
                                                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent md:bg-gradient-to-r" />
                                            
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                                                    <Award size={12} className="text-yellow-500" />
                                                    KARMA +50
                                                </div>
                                            </div>
                                            
                                            {opp.urgency === 'urgent' && (
                                                <div className="absolute bottom-4 left-4 bg-red-500/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg shadow-red-900/20">
                                                    CRITICAL NEED
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-red-500 transition-colors">
                                                            {opp.requester?.hospitalProfile?.hospitalName || opp.requester?.orgProfile?.organizationName || `${opp.requester?.firstName} ${opp.requester?.lastName}`}
                                                        </h3>
                                                        <p className="text-zinc-500 text-xs flex items-center gap-1.5">
                                                            <MapPin size={12} /> 
                                                            {opp.requester?.location?.address || `${opp.location?.coordinates[1]}, ${opp.location?.coordinates[0]}`}
                                                        </p>
                                                    </div>
                                                    <span className="bg-zinc-900 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400">
                                                        {format(new Date(opp.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                                
                                                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 mb-6 grid grid-cols-2 gap-px">
                                                    <div className="border-r border-white/5 pr-4">
                                                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Patient</p>
                                                        <div className="flex items-center gap-2">
                                                            {/* <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                                {opp.patientName.charAt(0)}
                                                            </div> */}
                                                            <p className="text-white font-medium text-sm">{opp.patientName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pl-4">
                                                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Requesting</p>
                                                        <p className="text-white font-bold text-sm flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded textxs ${opp.bloodGroup.includes('+') ? 'bg-red-500/10 text-red-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                {opp.bloodGroup}
                                                            </span>
                                                            <span className="text-zinc-400 font-normal text-xs">{opp.unitsNeeded} Units</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setSelectedTarget({ 
                                                    _id: opp._id, 
                                                    type: 'request', 
                                                    name: opp.requester?.hospitalProfile?.hospitalName || opp.requester?.orgProfile?.organizationName || `${opp.requester?.firstName} ${opp.requester?.lastName}`,
                                                    bloodGroup: opp.bloodGroup,
                                                    location: opp.location,
                                                    unitsNeeded: opp.unitsNeeded,
                                                    urgency: opp.urgency,
                                                    patientName: opp.patientName
                                                })}
                                                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            >
                                                View Request Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* MODE 2: FIND BLOOD */}
                    {mode === 'find' && (
                        <motion.div 
                            key="find"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Search Bar */}
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-2 rounded-[2rem] mb-10 flex flex-col md:flex-row gap-2 shadow-2xl">
                                <div className="flex-1 relative group">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                        <MapPin className="text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={searchQuery.city}
                                        onChange={(e) => setSearchQuery({...searchQuery, city: e.target.value})}
                                        className="w-full bg-transparent border-none rounded-full pl-12 pr-4 py-4 text-white focus:ring-0 placeholder-zinc-600 font-medium"
                                        placeholder="Enter City location..."
                                    />
                                </div>
                                <div className="w-full md:w-64 relative border-l border-white/5">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                         <Droplet className="text-zinc-500" size={18} />
                                    </div>
                                     <select 
                                        value={searchQuery.bloodGroup}
                                        onChange={(e) => setSearchQuery({...searchQuery, bloodGroup: e.target.value})}
                                        className="w-full bg-transparent border-none rounded-full pl-12 pr-10 py-4 text-white appearance-none focus:ring-0 cursor-pointer font-bold"
                                     >
                                        <option value="" className="bg-zinc-900 text-zinc-400">Any Blood Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                            <option key={bg} value={bg} className="bg-zinc-900">{bg}</option>
                                        ))}
                                     </select>
                                </div>
                                <button 
                                    onClick={handleSearch}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-[1.5rem] transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? '...' : <><Search size={20} /> Find</>}
                                </button>
                            </div>

                            {/* Results Feed */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {searchResults.map((result) => (
                                    <div key={result._id} className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold bg-zinc-900 border border-white/5 ${result.type === 'hospital' ? 'text-blue-500' : 'text-red-500'}`}>
                                                    {result.bloodGroup}
                                                 </div>
                                                 <div>
                                                     <h3 className="font-bold text-white text-lg leading-tight">{result.name}</h3>
                                                     <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                                                        {result.type === 'hospital' ? <ShieldCheck size={10} className="text-blue-500" /> : <Star size={10} className="text-yellow-500" />}
                                                        {result.type === 'hospital' ? 'Verified Hospital' : 'Star Donor'}
                                                     </p>
                                                 </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6 bg-zinc-900/30 p-4 rounded-xl">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500">Availability</span>
                                                <span className="text-white font-mono">{result.units} Units</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500">Distance</span>
                                                <span className="text-zinc-300 truncate max-w-[120px]">{result.location?.city || 'Nearby'}</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => !result.hasRequested && setSelectedTarget(result)}
                                            disabled={result.hasRequested}
                                            className={`w-full py-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                                                result.hasRequested 
                                                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800' 
                                                : 'bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/5'
                                            }`}
                                        >
                                            {result.hasRequested ? 'Request Sent' : <>Request Blood <ArrowRight size={14}/></>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            {searchResults.length === 0 && !loading && (
                                <div className="text-center py-20 opacity-50">
                                    <MapPin size={48} className="mx-auto mb-4 text-zinc-700"/>
                                    <p className="text-zinc-500">Enter a city to find lifesavers nearby</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* MODE 3: REQUESTS */}
                    {mode === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-12"
                        >
                            {/* 1. Incoming P2P Requests */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-px bg-zinc-800 flex-1" />
                                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail className="text-blue-500" size={16} /> Incoming Requests
                                    </h2>
                                    <div className="h-px bg-zinc-800 flex-1" />
                                </div>
                                
                                {myRequests.incoming.length === 0 ? (
                                    <div className="text-zinc-600 text-sm italic text-center py-10">
                                        No private requests received yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {myRequests.incoming.map(req => (
                                            <div key={req._id} className="bg-[#0A0A0A] border border-blue-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
                                                <div className="absolute top-0 right-0 p-4 bg-blue-500/10 rounded-bl-3xl border-l border-b border-blue-500/10">
                                                    <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"/> Direct
                                                    </span>
                                                </div>
                                                
                                                <div className="pr-12">
                                                    <h3 className="font-bold text-white text-xl mb-1">
                                                        {req.requester?.hospitalProfile?.hospitalName || req.requester?.orgProfile?.organizationName || `${req.requester?.firstName} ${req.requester?.lastName}`}
                                                    </h3>
                                                    <p className="text-zinc-500 text-xs mb-6">is asking for help for <span className="text-blue-400 font-medium">{req.patientName}</span></p>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 mb-6 bg-zinc-900/50 p-3 rounded-xl w-fit border border-white/5">
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-300 pr-3 border-r border-zinc-700">
                                                        <Droplet size={12} className="text-red-500" /> {req.bloodGroup}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                                                        <MapPin size={12} className="text-zinc-500" /> {req.requester?.location?.city || 'Unknown'}
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => setSelectedTarget({ 
                                                        _id: req._id, 
                                                        type: 'request', 
                                                        name: req.requester?.firstName || 'Requester',
                                                        bloodGroup: req.bloodGroup,
                                                        isDirect: true,
                                                        location: req.location || req.requester?.location,
                                                        unitsNeeded: req.unitsNeeded,
                                                        urgency: req.urgency,
                                                        patientName: req.patientName
                                                    })}
                                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                                                >
                                                    Respond Now
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* 2. My Outgoing Requests */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-px bg-zinc-800 flex-1" />
                                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <Navigation className="text-emerald-500" size={16} /> My Sent Requests
                                    </h2>
                                    <div className="h-px bg-zinc-800 flex-1" />
                                </div>

                                <div className="space-y-3">
                                    {myRequests.outgoing.length === 0 ? (
                                        <div className="text-zinc-600 text-sm italic text-center py-10">
                                            You haven't made any requests yet.
                                        </div>
                                    ) : (
                                        myRequests.outgoing.map(req => (
                                            <div key={req._id} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 ${req.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-900 text-zinc-500'}`}>
                                                        {req.status === 'fulfilled' ? <Check size={18} /> : <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="text-white font-bold text-sm">Request for {req.patientName}</p>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${req.isDirect ? 'border-blue-500/30 text-blue-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                                                                {req.isDirect ? 'DIRECT' : 'BROADCAST'}
                                                            </span>
                                                        </div>
                                                        <p className="text-zinc-500 text-xs">{format(new Date(req.createdAt), 'MMM d, yyyy')} • {req.bloodGroup}</p>
                                                    </div>
                                                </div>
                                                <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                    req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                                                    req.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {req.status}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                        </motion.div>
                    )}

                    {/* MODE 4: TICKETS */}
                    {mode === 'tickets' && (
                        <motion.div
                            key="tickets"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">My Donation Tickets</h2>
                                <p className="text-zinc-500 text-sm">Present these digital passes at the hospital</p>
                            </div>

                            {(!myRequests.accepted || myRequests.accepted.length === 0) ? (
                                <div className="text-center py-20 bg-zinc-900/30 rounded-[2rem] border border-white/5">
                                    <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Award size={32} className="text-zinc-600" />
                                    </div>
                                    <h3 className="text-zinc-300 font-bold text-lg mb-2">No Active Tickets</h3>
                                    <p className="text-zinc-500 text-sm max-w-xs mx-auto">Accept a request to generate a donation ticket.</p>
                                    <button 
                                        onClick={() => setMode('donate')}
                                        className="mt-6 bg-white text-black font-bold py-2 px-6 rounded-full text-sm hover:bg-zinc-200 transition-colors"
                                    >
                                        Find Opportunities
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {myRequests.accepted.map(ticket => (
                                        <div key={ticket._id} className="relative bg-white text-black rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
                                            {/* Top Section */}
                                            <div className="p-6 bg-gradient-to-br from-red-600 to-red-700 text-white relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                                
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div>
                                                        <h3 className="font-black text-2xl uppercase tracking-tighter">Donation Pass</h3>
                                                        <p className="text-red-100 text-xs font-mono">ID: {ticket._id.slice(-8).toUpperCase()}</p>
                                                    </div>
                                                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                                                        <Heart className="fill-white text-white" size={24} />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-4 relative z-10">
                                                    <div className="flex-1">
                                                        <p className="text-red-200 text-[10px] uppercase font-bold mb-1">Hospital</p>
                                                        <p className="font-bold leading-tight">
                                                            {ticket.requester?.hospitalProfile?.hospitalName || ticket.requester?.orgProfile?.organizationName || 'Community Request'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-red-200 text-[10px] uppercase font-bold mb-1">Date</p>
                                                        <p className="font-bold">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Perforation */}
                                            <div className="relative h-6 bg-white flex items-center">
                                                <div className="w-6 h-6 rounded-full bg-[#050505] -ml-3" />
                                                <div className="flex-1 border-b-2 border-dashed border-zinc-200 mx-2" />
                                                <div className="w-6 h-6 rounded-full bg-[#050505] -mr-3" />
                                            </div>

                                            {/* Bottom Section */}
                                            <div className="p-6 pt-2 bg-white flex items-center gap-6">
                                                <div className="flex-1">
                                                    <div className="mb-4">
                                                        <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Patient Name</p>
                                                        <p className="font-bold text-lg">{ticket.patientName}</p>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div>
                                                            <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Blood</p>
                                                            <p className="font-black text-2xl text-red-600">{ticket.bloodGroup}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Units</p>
                                                            <p className="font-black text-2xl text-zinc-900">{ticket.unitsNeeded}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* QR Code */}
                                                <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner border border-zinc-200">
                                                     <QRCodeSVG 
                                                        value={ticket._id} 
                                                        size={80}
                                                        level="H" 
                                                        className="w-full h-full"
                                                     />
                                                </div>
                                            </div>
                                            
                                            {/* Footer Warning */}
                                            <div className="px-6 py-3 bg-zinc-50 text-[10px] text-zinc-400 text-center font-mono border-t border-zinc-100 uppercase tracking-wider">
                                                Show this ticket at reception
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Request Modal */}
            <RequestModal 
                isOpen={!!selectedTarget} 
                onClose={() => setSelectedTarget(null)} 
                target={selectedTarget}
            />
        </div>
    );
};

export default DonorHub;
