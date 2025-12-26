import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../../store/useAuthStore';
import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';

const DonationTicket = ({ request }) => {
  const { user } = useAuthStore();
  
  if (!request || !user) return null;

  const payload = JSON.stringify({
    donorId: user._id,
    requestId: request._id,
    type: 'donation_ticket',
    timestamp: Date.now()
  });

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full mx-auto relative group">
        
        {/* Ticket Header */}
        <div className="bg-red-600 p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-1">Blood Donation Pass</p>
                        <h3 className="text-2xl font-black uppercase italic leading-none">Access<br/>Granted</h3>
                    </div>
                    <Ticket className="opacity-50" size={32} />
                </div>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
        </div>

        {/* Ticket Body */}
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl shrink-0">
                    {request.bloodGroup}
                </div>
                <div>
                   <h4 className="font-bold text-zinc-900 leading-tight">{request.hospitalName || request.requester?.hospitalProfile?.hospitalName}</h4>
                   <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{request.patientName}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1"><MapPin size={10} /> Location</p>
                    <p className="text-sm font-semibold text-zinc-800 truncate">
                         {request.requester?.location?.address || 'Hospital Location'}
                    </p>
                </div>
                <div className="space-y-1">
                     <p className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1"><Clock size={10} /> Urgency</p>
                     <p className={`text-sm font-bold uppercase ${
                         request.urgency === 'critical' ? 'text-red-600' : 'text-amber-500'
                     }`}>
                         {request.urgency}
                     </p>
                </div>
            </div>

            {/* Dashed Line */}
            <div className="relative border-t-2 border-dashed border-zinc-200 my-6">
                <div className="absolute -left-9 -top-3 w-6 h-6 bg-zinc-900 rounded-full" />
                <div className="absolute -right-9 -top-3 w-6 h-6 bg-zinc-900 rounded-full" />
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="bg-white p-2 rounded-xl border-2 border-zinc-900">
                    <QRCodeSVG 
                        value={payload} 
                        size={120} 
                        level="Q"
                    />
                </div>
                <p className="text-[10px] text-center text-zinc-400 w-2/3 leading-relaxed">
                    Present this code at the hospital reception to verify your donation.
                </p>
            </div>
        </div>

        {/* Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
    </div>
  );
};

export default DonationTicket;
