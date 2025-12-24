import React, { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LayoutDashboard,
  HeartPulse,
  History,
  Droplet,
  Building2,
  MapPin,
  Settings,
  LogOut,
  Tent,
  ClipboardList
} from "lucide-react";

const Sidebar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  // 1. Get User Role safely
  const role = user?.unsafeMetadata?.role || "donor";

  // 2. Define Links based on Role
  const roleLinks = {
    donor: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/donor/dashboard" },
      { icon: History, label: "My History", path: "/donor/history" },
      { icon: MapPin, label: "Nearby Camps", path: "/donor/camps" },
    ],
    hospital: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/hospital/dashboard" },
      { icon: Droplet, label: "Inventory", path: "/hospital/inventory" },
      { icon: ClipboardList, label: "Requests", path: "/hospital/create-request" },
    ],
    organization: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/org/dashboard" },
      { icon: Tent, label: "Manage Camps", path: "/org/camp-manage" },
    ]
  };

  const navItems = [
    ...roleLinks[role] || [],
    { icon: Settings, label: "Settings", path: "/settings" } // Global link
  ];

  // 3. GSAP Animation (Slide in from left)
  useGSAP(() => {
    gsap.fromTo(".nav-item", 
      { x: -20, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.2 }
    );
  }, { scope: sidebarRef });

  return (
    <aside 
      ref={sidebarRef} 
      className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 backdrop-blur-xl z-40"
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                <HeartPulse size={18} strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight dark:text-white">RedGrid</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <SidebarItem 
            key={item.path} 
            to={item.path} 
            icon={item.icon} 
            label={item.label} 
          />
        ))}
      </nav>

      {/* User / Logout Section */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-4 px-2">
            <img 
                src={user?.imageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
            />
            <div className="overflow-hidden">
                <p className="text-sm font-medium truncate dark:text-gray-200">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
            </div>
        </div>
        <button
          onClick={() => signOut(() => navigate("/"))}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-colors nav-item"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

// Helper Component for Links
const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
        isActive
          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
      }`
    }
  >
    {({ isActive }) => (
        <>
            <Icon size={20} className={isActive ? "fill-current opacity-20" : ""} />
            <span className="relative z-10">{label}</span>
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-r-full" />}
        </>
    )}
  </NavLink>
);

export default Sidebar;