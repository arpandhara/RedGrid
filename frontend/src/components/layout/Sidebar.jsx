import React, { useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LayoutDashboard,
  HeartPulse,
  History,
  Droplet,
  ClipboardList,
  Tent,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin
} from "lucide-react";

const Sidebar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  // Mobile Toggle State
  const [isOpen, setIsOpen] = useState(false);

  const role = user?.unsafeMetadata?.role || "donor";

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
    ...(roleLinks[role] || []),
    { icon: Settings, label: "Settings", path: "/settings" }
  ];

  // GSAP Animation for Desktop load
  useGSAP(() => {
    gsap.fromTo(".nav-item", 
      { x: -20, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.2 }
    );
  }, { scope: sidebarRef });

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* --- MOBILE HAMBURGER BUTTON --- */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={toggleSidebar}
          className="p-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg shadow-lg active:scale-95 transition-transform"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- SIDEBAR CONTAINER --- */}
      {/* 1. fixed: Always on screen
          2. -translate-x-full: Hidden by default on mobile
          3. md:translate-x-0: Always visible on desktop
          4. transition-transform: Smooth slide effect
      */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-screen w-64 bg-black border-r border-zinc-800 z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 
        `}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-red-900/20 shadow-lg">
                  <HeartPulse size={18} strokeWidth={3} />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">RedGrid</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              to={item.path} 
              icon={item.icon} 
              label={item.label}
              onClick={() => setIsOpen(false)} // Close on click (mobile)
            />
          ))}
        </nav>

        {/* User / Logout Section */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
              <img 
                  src={user?.imageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-zinc-700"
              />
              <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate text-zinc-200">{user?.fullName}</p>
                  <p className="text-xs text-zinc-500 truncate capitalize">{role}</p>
              </div>
          </div>
          <button
            onClick={() => signOut(() => navigate("/"))}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-900/10 hover:text-red-400 transition-colors nav-item group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay (Click to close) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
        isActive
          ? "bg-red-600/10 text-red-500 border border-red-900/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
      }`
    }
  >
    {({ isActive }) => (
        <>
            <Icon size={20} className={isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300"} />
            <span className="relative z-10">{label}</span>
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-r-full shadow-[0_0_10px_#dc2626]" />}
        </>
    )}
  </NavLink>
);

export default Sidebar;