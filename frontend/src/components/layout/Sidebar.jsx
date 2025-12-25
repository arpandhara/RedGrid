import React, { useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import useAuthStore from "../../store/useAuthStore"; // Import your store
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
  Bell,
  X,
  MapPin,
  ChevronRight,
  Loader2 
} from "lucide-react";

const Sidebar = () => {
  // 1. Get Clerk User (for Image) AND MongoDB User (for Role/Data)
  const { user: clerkUser } = useUser();
  const { user: mongoUser, clearUser } = useAuthStore();
  
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 2. Use Role from MongoDB Store (Source of Truth)
  const role = mongoUser?.role || "donor";

  const roleLinks = {
    donor: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/donor/dashboard" },
      { icon: Bell, label: "Notifications", path: "/donor/notifications" }, // Added Notification Link
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
      { icon: Tent, label: "Manage Camps", path: "/org/camps" }, // Matched route to your router
    ]
  };

  const navItems = [
    ...(roleLinks[role] || []),
    { icon: Settings, label: "Settings", path: "/settings" }
  ];

  useGSAP(() => {
    gsap.fromTo(".nav-item", 
      { x: -20, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.2 }
    );
    
    gsap.fromTo(".sidebar-footer",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.5 }
    );
  }, { scope: sidebarRef });

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut(async () => {
      clearUser(); // 3. Clear local store on logout
      navigate("/");
    });
  };

  return (
    <>
      {/* --- MOBILE HAMBURGER BUTTON --- */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={toggleSidebar}
          className="p-2.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 text-white rounded-xl shadow-xl active:scale-95 transition-all"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* --- SIDEBAR CONTAINER --- */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-screen w-72 bg-[#09090b] border-r border-white/5 z-40
          flex flex-col shadow-2xl shadow-black
          transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 
        `}
      >
        {/* Header / Logo */}
        <div className="h-24 flex items-center px-8">
          <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20 group-hover:scale-105 transition-transform duration-300">
                  <HeartPulse size={22} strokeWidth={2.5} />
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-white leading-none">RedGrid</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mt-1">Life Saver</span>
              </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Menu</div>
          {navItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              to={item.path} 
              icon={item.icon} 
              label={item.label}
              onClick={() => setIsOpen(false)}
            />
          ))}
        </nav>

        {/* User / Logout Section */}
        <div className="sidebar-footer p-4 mt-auto">
            <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-4 backdrop-blur-sm">
                
                {/* User Profile Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        {/* Use Clerk Image, fallback to placeholder */}
                        <img 
                            src={clerkUser?.imageUrl || "https://via.placeholder.com/40"} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full border-2 border-zinc-800 object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
                    </div>
                    <div className="overflow-hidden flex-1">
                        {/* Use MongoDB Name if available, else Clerk Name */}
                        <p className="text-sm font-semibold truncate text-zinc-100">
                           {mongoUser ? `${mongoUser.firstName} ${mongoUser.lastName}` : clerkUser?.fullName}
                        </p>
                        <p className="text-xs text-zinc-500 truncate capitalize flex items-center gap-1">
                            {role}
                        </p>
                    </div>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-200 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <span className="flex items-center gap-2">
                        {isLoggingOut ? (
                           <Loader2 size={16} className="animate-spin text-red-500" />
                        ) : (
                           <LogOut size={16} />
                        )}
                        <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                    </span>
                    
                    {!isLoggingOut && (
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    )}
                </button>
            </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-30 md:hidden"
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
      `nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
        isActive
          ? "bg-gradient-to-r from-red-600/10 to-transparent text-red-500 border-l-2 border-red-500"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
      }`
    }
  >
    {({ isActive }) => (
        <>
            <Icon 
                size={20} 
                className={`transition-colors duration-200 ${isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300"}`} 
            />
            <span className="relative z-10">{label}</span>
        </>
    )}
  </NavLink>
);

export default Sidebar;