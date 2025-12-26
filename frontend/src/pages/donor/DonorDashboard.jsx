import React, { useEffect, useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import { useAuth } from '@clerk/clerk-react';
import { useSocket } from '../../context/SocketContext';
import api from "../../api/axios";
import { format } from "date-fns";
import { 
    Heart, Calendar, MapPin, 
    Bell, ChevronRight, Droplet, 
    Search, User, PlayCircle, ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import toast from 'react-hot-toast';

// Components
import DigitalIDCard from "../../components/donor/DigitalIDCard";
import ProfileUpdateModal from "../../components/donor/ProfileUpdateModal";
import OnboardingWizard from "../../components/onboarding/OnboardingWizard";

const DonorDashboard = () => {
  const { user } = useAuthStore();
  const { getToken } = useAuth();
  const { socket } = useSocket();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalDonations: 0,
    livesSaved: 0,
    lastDonation: null,
    recentDonations: []
  });

  // Data Fetching
  const fetchStats = async () => {
    try {
      const token = await getToken();
      const res = await api.get('/donations/my-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Socket Listener
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
        if (data.type === 'general' || data.title?.includes('Verified')) {
          fetchStats();
          toast.success('Dashboard updated');
        }
    };
    socket.on('notification', handleUpdate);
    return () => socket.off('notification', handleUpdate);
  }, [socket]);

  if (!user) return <div className="min-h-screen bg-black" />;

  const needsOnboarding = !user.isOnboarded;
  
  // Logic
  const lastDateStr = stats?.lastDonationDate;
  const lastDate = lastDateStr ? new Date(lastDateStr) : null;
  const isValidDate = lastDate && !isNaN(lastDate.getTime());
  const nextEligibleDate = isValidDate 
      ? new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000) 
      : new Date();
  
  const isDateEligible = new Date() >= nextEligibleDate;
  const rank = stats.totalDonations >= 10 ? "Legend" : stats.totalDonations >= 5 ? "Savior" : stats.totalDonations >= 3 ? "Hero" : "Rookie";
  const userLocation = user.location?.coordinates || [88.3639, 22.5726];

  return (
    <div className={`min-h-screen bg-black text-white p-6 md:p-10 ${needsOnboarding ? "h-screen overflow-hidden" : ""}`}>
      
      {needsOnboarding && <div className="fixed inset-0 z-[100]"><OnboardingWizard /></div>}
      {isProfileModalOpen && <ProfileUpdateModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}

      <div className={`max-w-7xl mx-auto transition-all duration-300 ${needsOnboarding ? "blur-xl" : ""}`}>
        
        {/* 1. HEADER SECTON */}
        <div className="flex items-start justify-between mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.firstName}!</h1>
                <p className="text-zinc-500">Let's save more lives today.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-500">{rank} Donor</span>
                </div>
                <Link to="/donor/notifications" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors relative">
                    <Bell size={18} className="text-zinc-400" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-zinc-900"/>
                </Link>
            </div>
        </div>

        {/* 2. STATS ROW (Replicating Image Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Card 1: Total Donations */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-start justify-between relative overflow-hidden group">
                 <div>
                     <p className="text-zinc-500 text-sm font-medium mb-1">Total Donations</p>
                     <h3 className="text-4xl font-bold text-white mb-2">{stats.totalDonations}</h3>
                     <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                        +2 this month
                     </p>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Droplet size={24} />
                 </div>
            </div>

            {/* Card 2: Lives Impacted */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-start justify-between relative overflow-hidden group">
                 <div>
                     <p className="text-zinc-500 text-sm font-medium mb-1">Lives Impacted</p>
                     <h3 className="text-4xl font-bold text-white mb-2">{stats.livesSaved}</h3>
                     <p className="text-zinc-500 text-xs font-medium">
                        3 lives per donation
                     </p>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Heart size={24} />
                 </div>
            </div>

             {/* Card 3: Next Eligible */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-start justify-between relative overflow-hidden group">
                 <div>
                     <p className="text-zinc-500 text-sm font-medium mb-1">Next Eligible Date</p>
                     <h3 className="text-4xl font-bold text-white mb-2">
                        {isDateEligible ? 'Today' : format(nextEligibleDate, 'MMM d')}
                     </h3>
                     <p className={`text-xs font-bold ${isDateEligible ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {isDateEligible 
                            ? 'Ready to donate now' 
                            : `${Math.ceil((nextEligibleDate - new Date()) / (1000 * 60 * 60 * 24))} days from now`}
                     </p>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Calendar size={24} />
                 </div>
            </div>
        </div>

        {/* 3. HERO BANNER (Pink/Red CTA Area) */}
        <div className="bg-gradient-to-r from-red-900/20 to-zinc-900 border border-red-900/30 rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
             <div className="relative z-10 w-full md:w-auto">
                 <h2 className="text-2xl font-bold text-white mb-2">Ready to Save Lives?</h2>
                 <p className="text-zinc-400 mb-6 max-w-lg">Find nearby donation centers and schedule your next donation appointment today.</p>
                 <div className="flex flex-wrap gap-4">
                    <Link to="/donor/camps" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-flex items-center gap-2">
                        <Search size={18} /> Find Nearby Centers
                    </Link>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-flex items-center gap-2 border border-zinc-700">
                        <Search size={18} /> View Blood Requests
                    </button>
                 </div>
             </div>
             {/* Decorative Circles */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* 4. MAIN CONTENT SPLIT (Activity vs Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: Recent Activity Timeline */}
            <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                <div className="space-y-8 pl-2">
                    {stats.recentDonations?.length === 0 ? (
                        <div className="py-10 text-center text-zinc-500 border border-zinc-800 rounded-2xl bg-zinc-900/50">
                            No recent activity. Your journey starts here!
                        </div>
                    ) : (
                        stats.recentDonations.slice(0, 5).map((donation, i) => (
                            <div key={i} className="flex gap-4 relative">
                                {/* Vertical Line */}
                                {i !== stats.recentDonations.length - 1 && (
                                    <div className="absolute left-[19px] top-10 bottom-[-32px] w-[2px] bg-zinc-800" />
                                )}
                                
                                {/* Icon Circle */}
                                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 z-10">
                                    <Droplet size={16} className="text-red-500" />
                                </div>

                                {/* Content */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex-1 hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white">Donation Completed</h4>
                                        <span className="text-xs text-zinc-500">{format(new Date(donation.createdAt), 'MMM d, yyyy')}</span>
                                    </div>
                                    <p className="text-zinc-400 text-sm mb-3">
                                        {donation.hospital?.hospitalProfile?.hospitalName || 'Verified Donation Center'}
                                    </p>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">
                                        <ShieldCheck size={12} /> Verified
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Sidebar (Digital ID + Map) */}
            <div className="space-y-8">
                
                {/* 1. Digital ID Widget */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Digital ID</h3>
                    </div>
                    {/* The Full Scaled Card */}
                    <div className="w-full">
                        <DigitalIDCard />
                    </div>
                </div>

                {/* 2. Map Widget */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-xl font-bold text-white">Nearby</h3>
                         <Link to="/donor/camps" className="text-xs font-bold text-red-500 hover:text-red-400">View All</Link>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-64 relative group">
                        <MapContainer 
                            center={[userLocation[1], userLocation[0]]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            dragging={false}
                            scrollWheelZoom={false}
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Marker position={[userLocation[1], userLocation[0]]} />
                        </MapContainer>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60 pointer-events-none" />
                        
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                    <MapPin size={16} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-xs font-bold truncate">Current Location</p>
                                    <p className="text-zinc-500 text-[10px] truncate">{user.location?.city || "Locating..."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>

      </div>
    </div>
  );
};

export default DonorDashboard;
