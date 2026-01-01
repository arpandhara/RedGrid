
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Phone, Navigation, ShieldCheck, Heart, Filter, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';
import ScheduleDonationModal from '../../components/donor/ScheduleDonationModal';

const DonorCamps = () => {
    const [searchQuery, setSearchQuery] = useState({ city: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [includeHospitals, setIncludeHospitals] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [interactions, setInteractions] = useState({ scheduled: [], donated: [] });

    // Initial load
    useEffect(() => {
        handleSearchCenters();
        fetchInteractions();
    }, []);

    const fetchInteractions = async () => {
        try {
            const res = await api.get('/donations/interactions');
            if (res.data.success) {
                setInteractions(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch interactions", error);
        }
    };

    const handleSearchCenters = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.city) params.append('city', searchQuery.city);
            
            const res = await api.get(`/search/centers?${params.toString()}`);
            
            if (res.data.success) {
                setSearchResults(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = searchResults.filter(r => {
        if (includeHospitals) return true; // Show everything
        return r.type === 'organization'; // Show only organizations (Camps)
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pb-32 font-sans selection:bg-red-500/30">
            
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="max-w-5xl mx-auto mb-12 sticky top-4 z-40">
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-red-500/20 rounded-xl">
                            <MapPin className="text-red-500 fill-red-500/50" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-none">Find Donation Camps</h1>
                            <p className="text-xs text-zinc-500 mt-1">Discover nearby centers to donate blood</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Search & Filter Section */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-2 rounded-[2rem] flex flex-col md:flex-row gap-2 shadow-2xl">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={searchQuery.city}
                                onChange={(e) => setSearchQuery({...searchQuery, city: e.target.value})}
                                className="w-full bg-transparent border-none rounded-full pl-12 pr-4 py-4 text-white focus:ring-0 placeholder-zinc-600 font-medium"
                                placeholder="Enter your city (e.g. Mumbai, Delhi)..."
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 px-2">
                            <button 
                                onClick={() => setIncludeHospitals(!includeHospitals)}
                                className={`px-6 py-4 rounded-full font-bold transition-all text-sm flex items-center gap-2 border ${!includeHospitals ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700'}`}
                            >
                                <Filter size={16} /> {includeHospitals ? 'Showing All Centers' : 'Showing Camps Only'}
                            </button>
                            
                            <button 
                                onClick={handleSearchCenters}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-[1.5rem] transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center gap-2 shrink-0"
                            >
                                {loading ? '...' : <><Search size={20} /> Search</>}
                            </button>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredResults.map((center, index) => (
                                <motion.div 
                                    key={center._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col h-full"
                                >
                                    {/* Badges */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${center.type === 'hospital' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {center.type === 'hospital' ? <ShieldCheck size={24} /> : <Navigation size={24} />}
                                        </div>
                                        {center.isCamp && (
                                            <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-yellow-500/20 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"/> TEMPORARY CAMP
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-xl leading-tight mb-2 group-hover:text-red-500 transition-colors">{center.name}</h3>
                                        <p className="text-zinc-500 text-sm flex items-start gap-2 leading-relaxed mb-4">
                                            <MapPin size={14} className="mt-1 shrink-0" /> 
                                            {center.location?.address}, {center.location?.city}
                                        </p>

                                        {center.expiresAt && (
                                            <div className="bg-zinc-900/50 rounded-xl p-3 mb-4 flex items-center gap-3 border border-white/5">
                                                <Calendar size={16} className="text-zinc-400" />
                                                <div>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Active Until</p>
                                                    <p className="text-sm text-white font-medium">{format(new Date(center.expiresAt), 'PPP')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-white/5">
                                        {/* Status Button Logic */}
                                        {interactions.donated.includes(center._id) ? (
                                            <button 
                                                disabled
                                                className="col-span-2 bg-green-900/50 border border-green-500/50 text-green-500 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                                            >
                                                <Heart size={16} className="fill-current" /> Donated Recently
                                            </button>
                                        ) : interactions.scheduled.includes(center._id) ? (
                                             <button 
                                                disabled
                                                className="col-span-2 bg-yellow-900/50 border border-yellow-500/50 text-yellow-500 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                                            >
                                                <Calendar size={16} className="fill-current" /> Scheduled
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedCenter(center)}
                                                className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                                            >
                                                <Heart size={16} className="fill-current" /> Donate Here
                                            </button>
                                        )}
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.location?.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-zinc-800"
                                        >
                                            <Navigation size={14} /> Directions
                                        </a>
                                        {center.phone && (
                                            <a 
                                                href={`tel:${center.phone}`}
                                                className="bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Phone size={14} /> Call
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Empty State */}
                    {filteredResults.length === 0 && !loading && (
                        <div className="text-center py-32 opacity-50 bg-zinc-900/30 rounded-[3rem] border border-white/5">
                            <MapPin size={64} className="mx-auto mb-6 text-zinc-700"/>
                            <h3 className="text-xl font-bold text-white mb-2">No Centers Found</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto">Try searching for a different city or removing filters to see more results.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            <AnimatePresence>
                {selectedCenter && (
                    <ScheduleDonationModal 
                        center={selectedCenter} 
                        onClose={() => setSelectedCenter(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DonorCamps;
