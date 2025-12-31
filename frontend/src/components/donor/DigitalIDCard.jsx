import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../../store/useAuthStore';
import { ShieldCheck, Calendar, Droplet, Share2, Copy } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';

const DigitalIDCard = () => {
  const { user } = useAuthStore();
  const cardRef = useRef(null);
  
  // Generate a payload that the hospital will scan
  // In a real app, this might be a signed JWT or a temporary token
  const qrPayload = JSON.stringify({
    donorId: user?._id,
    type: 'digital_id',
    timestamp: Date.now() 
  });

  useGSAP(() => {
    gsap.fromTo(cardRef.current,
        {   rotateY: 90, opacity: 0 },
        {   rotateY: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user?.clerkId);
    toast.success("Donor ID copied to clipboard");
  };

  if (!user) return null;

  return (
    <div className="perspective-1000 w-full max-w-sm mx-auto">
      <div 
        ref={cardRef}
        className="relative w-full aspect-[1.58/1] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
        style={{
            background: 'linear-gradient(135deg, #18191c 0%, #000000 100%)',
            boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25)' 
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Card Content */}
        <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between z-10 w-full">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
                        <Droplet size={16} className="text-white fill-current md:w-5 md:h-5" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold tracking-tight text-base md:text-lg leading-none">RedGrid</h3>
                        <p className="text-[9px] md:text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-0.5 md:mt-1 font-semibold">Official Donor</p>
                    </div>
                </div>
                <button onClick={handleCopyId} className="text-zinc-500 hover:text-white transition-colors">
                    <Copy size={16} />
                </button>
            </div>

            {/* Middle Section: Auto-Layout info + QR */}
            <div className="flex items-end justify-between gap-2 mt-auto mb-2">
                <div className="flex-1 space-y-2 md:space-y-4 min-w-0">
                    <div>
                        <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Name</p>
                        <p className="text-white font-medium text-sm md:text-lg truncate pr-2">
                            {user.firstName} {user.lastName}
                        </p>
                    </div>
                    
                    <div className="flex gap-4 md:gap-6">
                        <div>
                            <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Blood Type</p>
                            <p className="text-red-500 font-black text-xl md:text-2xl">{user.donorProfile?.bloodGroup || "??"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Status</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${user.donorProfile?.isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                                <span className="text-xs md:text-sm font-medium text-zinc-300">
                                    {user.donorProfile?.isAvailable ? 'Active' : 'Busy'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Area - Fixed size on minimal screens */}
                <div className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shrink-0">
                    <QRCodeSVG 
                        value={qrPayload} 
                        size={80} // Smaller default for mobile
                        className="w-[70px] h-[70px] md:w-[100px] md:h-[100px]" // Responsive sizing via class/style override if supported or standard transform
                        level="M"
                        includeMargin={false}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Verified Identity</span>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">
                    ID: {user._id?.slice(-8).toUpperCase()}
                </div>
            </div>

        </div>

        {/* Shine/Glare Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
      
      <p className="text-center text-zinc-500 text-xs mt-4">
        Show this QR code to hospital staff for quick verification.
      </p>
    </div>
  );
};

export default DigitalIDCard;
