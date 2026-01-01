import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Droplet, Users, ArrowRight, Plus, Bell, Building2 } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axios";
import { useSocket } from "../../context/SocketContext";
import OnboardingWizard from "../../components/onboarding/OnboardingWizard";
import IncomingDonations from "../../components/hospital/IncomingDonations";
import { format } from 'date-fns';

const OrgDashboard = () => {
  const { user } = useAuthStore();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalUnits: 0,
    activeRequests: 0,
    totalDonations: 0,
    criticalRequests: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Stats & Recent Activity on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reuse hospital stats endpoint as it likely returns relevant data for orgs too (user based)
        const [statsRes, requestsRes] = await Promise.all([
            api.get('/hospital/stats'),
            api.get('/requests/hospital?limit=5') 
        ]);
        
        setStats(statsRes.data.data);

        // Map requests to activity format (if any legacy requests exist)
        const recentActivities = requestsRes.data.data.slice(0, 5).map(req => ({
            id: req._id,
            type: 'request',
            title: 'Request Active',
            message: `Request for ${req.bloodGroup} (${req.unitsNeeded} units)`,
            time: new Date(req.createdAt)
        }));
        
        setActivities(recentActivities);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.isOnboarded) {
      fetchData();
    }
  }, [user]);

  // 2. Real-time Activity Listener
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (data) => {
        setActivities(prev => [{
            id: Date.now(),
            type: data.type || 'notification',
            title: data.title || 'New Update',
            message: data.message,
            time: new Date()
        }, ...prev].slice(0, 10)); // Keep last 10
    };

    socket.on('notification', handleNewActivity);
    socket.on('donation_verified', (data) => handleNewActivity({
        type: 'donation',
        title: 'Donation Verified',
        message: `${data.bloodGroup} donation verified for ${data.donorName || 'Donor'}`
    }));

    return () => {
        socket.off('notification');
        socket.off('donation_verified');
    };
  }, [socket]);

  if (!user) return <div className="animate-pulse h-96 rounded-xl bg-zinc-900" />;
  
  const needsOnboarding = !user.isOnboarded;

  const statCards = [
    { label: "Blood Units Collected", value: stats.totalUnits, icon: Droplet, color: "text-red-500" },
    { label: "Donations Received", value: stats.totalDonations, icon: Users, color: "text-emerald-500" },
    // Removed Active Requests/Critical Needs as Camps don't broadcast
    { label: "Camp Status", value: "Active", icon: Activity, color: "text-blue-500" },
  ];

  return (
    <div className={`relative min-h-screen ${needsOnboarding ? "h-screen overflow-hidden" : ""}`}>
      
      {needsOnboarding && (
        <div className="fixed inset-0 z-50">
          <OnboardingWizard />
        </div>
      )}

      <div className={`max-w-7xl mx-auto transition-all duration-500 ${
        needsOnboarding ? "blur-xl scale-95 opacity-50 pointer-events-none" : ""
      }`}>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Camp Dashboard</h1>
          <p className="text-zinc-400">Manage your camp donations and inventory.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white mt-2">
                    {loading ? "..." : stat.value}
                  </h3>
                </div>
                <div className={`p-3 bg-zinc-800/50 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              
              {/* Decorative gradient */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color.replace('text', 'from')}/20 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50`} />
            </div>
          ))}
        </div>


        {/* Incoming Donations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <IncomingDonations />
            
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4">
                     {/* Manage Profile Card */}
                     <Link 
                        to="/org/camps" 
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition group block"
                    >
                        <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-zinc-800 rounded-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Manage Requests</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                        View and manage your blood donation drives
                        </p>
                    </Link>
                     {/* Update Inventory Card */}
                    <Link 
                        to="/hospital/inventory" // Reusing Hospital Inventory Page
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition group block"
                    >
                        <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-zinc-800 rounded-lg">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Update Inventory</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                        Add or remove blood units collected at camp
                        </p>
                    </Link>

                    {/* Verify Donation Card */}
                    <Link 
                        to="/hospital/verify-donation" // Reusing Verify Page
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition group block"
                    >
                        <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-zinc-800 rounded-lg">
                             <div className="w-6 h-6 bg-white rounded-sm" /> {/* Mock QR Icon */}
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Scan Donor QR</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                             Physically verify a donor using their digital ID
                        </p>
                    </Link>
                </div>
            </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-red-500" size={20} />
                Live Activity Log
            </h2>
            <div className="flex items-center gap-2 text-xs text-green-500 animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Real-time
            </div>
          </div>
          
          <div className="space-y-4">
            {activities.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                    No recent activity updates yet...
                </div>
            ) : (
                activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border-l-2 border-red-500 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            act.type === 'donation' ? 'bg-green-500/10 text-green-500' :
                            'bg-red-500/10 text-red-500'
                        }`}>
                            {act.type === 'donation' ? <Users size={18} /> : 
                             <Bell size={18} />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{act.title}</p>
                            <p className="text-xs text-zinc-400">{act.message}</p>
                        </div>
                        </div>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                            {format(act.time, 'h:mm a')}
                        </span>
                    </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrgDashboard;