import React from "react";
import { Link } from "react-router-dom"; // Import Link
import { 
  Activity, 
  Droplet, 
  Users, 
  Clock, 
  ArrowRight, 
  Siren, 
  Plus 
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const HospitalDashboard = () => {
  const { user } = useAuthStore();

  const stats = [
    { label: "Blood Units", value: "1,240", icon: Droplet, color: "text-red-500" },
    { label: "Active Requests", value: "8", icon: Activity, color: "text-blue-500" },
    { label: "Donors Visited", value: "45", icon: Users, color: "text-emerald-500" },
    { label: "Pending", value: "12", icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Hospital Dashboard</h1>
        <p className="text-zinc-400">Manage your inventory and blood requests.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 bg-zinc-800 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-xs text-emerald-400">
              <span className="font-medium">+12%</span>
              <span className="text-zinc-500 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* CREATE REQUEST CARD (Updated) */}
        <Link 
          to="/hospital/create-request"
          className="bg-red-600 rounded-xl p-6 text-white hover:bg-red-700 transition shadow-lg shadow-red-900/20 group cursor-pointer block"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/30 rounded-lg">
              <Siren className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-lg font-bold">Broadcast Request</h3>
          <p className="text-red-100 text-sm mt-1">
            Instantly notify donors within 10km radius
          </p>
        </Link>

        {/* Update Inventory Card */}
        <Link 
          to="/hospital/inventory"
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
            Add or remove blood units manually
          </p>
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Blood Unit Added</p>
                  <p className="text-xs text-zinc-400">O+ (2 Units) added to inventory</p>
                </div>
              </div>
              <span className="text-xs text-zinc-500">2 mins ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;