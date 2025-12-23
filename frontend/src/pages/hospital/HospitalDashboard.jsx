import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';
import { useClerk } from '@clerk/clerk-react'; // Import Clerk for Logout
import { 
  ShieldCheck, Clock, FileText, Loader2, CheckCircle2, 
  AlertCircle, ChevronRight, HelpCircle, Building2, Shield, LogOut 
} from 'lucide-react';

const HospitalDashboard = () => {
  const { user, logout } = useAuthStore();
  const { signOut } = useClerk(); // Clerk Hook

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    await signOut();
    logout();
  };

  // 1. Loading State
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    );
  }

  // 2. Onboarding Check
  if (!user.isOnboarded) return <OnboardingWizard />;

  // 3. VERIFICATION PENDING STATE
  if (user.role === 'hospital' && !user.hospitalProfile?.isVerified) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
        
        {/* === LEFT PANEL: Cinematic Status === */}
        <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 relative flex-col justify-between p-12 border-r border-zinc-800 overflow-hidden">
             
             {/* Abstract Background Blobs */}
             <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />

             <div className="relative z-10">
                 {/* Logo */}
                 <div className="flex items-center gap-3 mb-12">
                     <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-900/50">R</div>
                     <span className="text-2xl font-bold text-white tracking-tight">RedGrid</span>
                 </div>

                 {/* Main Status Text */}
                 <div className="mt-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold uppercase tracking-wider mb-6">
                        <Clock size={16} className="animate-pulse"/>
                        In Review
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                        We are verifying <br/> your profile.
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                        Safety is our #1 priority. We manually review every hospital to prevent fraud and ensure a safe blood supply chain.
                    </p>
                 </div>
             </div>

             {/* Bottom Visual */}
             <div className="relative z-10">
                 <div className="p-6 bg-zinc-800/50 backdrop-blur-md rounded-2xl border border-zinc-700/50 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300">
                        <Shield size={24} />
                     </div>
                     <div>
                        <p className="text-white font-semibold">Secure Verification</p>
                        <p className="text-zinc-500 text-sm">Your documents are encrypted.</p>
                     </div>
                 </div>
             </div>
        </div>

        {/* === RIGHT PANEL: Timeline & Details === */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative overflow-y-auto">
            
            {/* --- LOGOUT BUTTON (Desktop: Absolute Top-Right | Mobile: In Header) --- */}
            <div className="hidden lg:block absolute top-6 right-6 z-30">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-sm font-medium"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                    <span className="font-bold text-zinc-900 dark:text-white">RedGrid</span>
                </div>
                <button onClick={handleLogout} className="text-zinc-500 hover:text-red-600">
                    <LogOut size={20} />
                </button>
            </div>

            <div className="flex-1 p-6 lg:p-20 max-w-3xl mx-auto w-full">
                
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Application Status</h2>
                <p className="text-zinc-500 mb-12">
                    Tracking ID: #{user._id?.slice(-8).toUpperCase() || "PENDING"}
                </p>

                {/* Vertical Timeline */}
                <div className="space-y-0 relative pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 ml-4">
                    
                    {/* Step 1: Registered */}
                    <div className="relative pb-12 pl-8">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white dark:ring-black" />
                         <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Registration Complete <CheckCircle2 size={18} className="text-green-500" />
                         </h3>
                         <p className="text-zinc-500 text-sm mt-1">
                            Account created for <strong>{user.hospitalProfile?.hospitalName}</strong> on {new Date(user.createdAt).toLocaleDateString()}.
                         </p>
                    </div>

                    {/* Step 2: Uploaded */}
                    <div className="relative pb-12 pl-8">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white dark:ring-black" />
                         <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Documents Submitted <CheckCircle2 size={18} className="text-green-500" />
                         </h3>
                         
                         {/* Document Card */}
                         <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-4 group hover:border-red-200 dark:hover:border-red-900/30 transition-colors cursor-default">
                             <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-red-500">
                                <FileText size={24} />
                             </div>
                             <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-zinc-900 dark:text-white truncate">License_Document.pdf</p>
                                <p className="text-xs text-zinc-500">Uploaded via Secure Upload</p>
                             </div>
                             {user.hospitalProfile?.licenseDocumentUrl && (
                                <a 
                                  href={user.hospitalProfile.licenseDocumentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    View
                                </a>
                             )}
                         </div>
                    </div>

                    {/* Step 3: Reviewing (Active) */}
                    <div className="relative pl-8">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-white dark:ring-black animate-pulse" />
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500/30 animate-ping" />
                         
                         <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Admin Verification
                         </h3>
                         <div className="mt-4 p-5 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 text-orange-800 dark:text-orange-200 text-sm leading-relaxed">
                            <p className="font-semibold mb-1">Estimated Wait: 2 - 4 Hours</p>
                            <p className="opacity-80">
                                Our administrators are currently verifying your medical license number 
                                <span className="font-mono bg-orange-100 dark:bg-orange-900/40 px-1 rounded ml-1">
                                    {user.hospitalProfile?.registrationNumber}
                                </span> against the national database.
                            </p>
                         </div>
                    </div>

                </div>

                {/* Footer Notice */}
                <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                        <AlertCircle size={18} /> What happens next?
                    </h4>
                    <p className="text-zinc-500 text-sm">
                        Once approved, you will receive an email notification and full access to the Hospital Dashboard will be unlocked instantly.
                    </p>
                </div>

            </div>

            {/* Bottom Help Bar */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black sticky bottom-0 z-30">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <p className="text-sm text-zinc-500 hidden sm:block">Having trouble?</p>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm">
                        <HelpCircle size={18} /> Contact Support
                    </button>
                </div>
            </div>

        </div>
      </div>
    );
  }

  // 4. APPROVED DASHBOARD (Visible only if verified)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
       <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-bold dark:text-white">Hospital Dashboard</h1>
          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 rounded-xl mt-4 inline-flex items-center gap-2">
             <ShieldCheck size={20} /> Account Verified & Active
          </div>
          
          {/* ... Dashboard Widgets would go here ... */}
          
       </div>
    </div>
  );
};

export default HospitalDashboard;