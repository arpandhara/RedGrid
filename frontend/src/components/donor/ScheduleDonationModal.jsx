
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, Heart } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

const ScheduleDonationModal = ({ center, onClose }) => {
    const { getToken } = useAuth();
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSchedule = async () => {
        if (!date || !slot) {
            toast.error("Please select a date and time slot.");
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            const res = await api.post('/donations/schedule', {
                centerId: center._id,
                date: date,
                slot: slot
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setSuccess(true);
                toast.success("Donation Scheduled!");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Scheduling failed");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
                        <p className="text-zinc-400 mb-8">
                            Your donation at <span className="text-white font-semibold">{center.name}</span> has been scheduled.
                        </p>
                        <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-colors">
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                <Heart className="text-red-500 fill-red-500" /> Donate Blood
                            </h2>
                            <p className="text-zinc-400 text-sm">Schedule your visit to {center.name}</p>
                        </div>

                        <div className="space-y-6">
                            {/* Date Picker */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
                                    <input 
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        max={center.expiresAt ? new Date(center.expiresAt).toISOString().split('T')[0] : undefined}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Slot Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preferred Time</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Morning', 'Afternoon', 'Evening'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSlot(s)}
                                            className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                                                slot === s 
                                                ? 'bg-red-600 text-white border-red-500' 
                                                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                             {/* Location Summary */}
                             <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex items-start gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                                    <Clock size={16} />
                                </div>
                                <div className="text-xs text-zinc-500">
                                    <p className="mb-1">Please arrive 15 minutes before your slot.</p>
                                    <p>Address: <span className="text-zinc-300">{center.location?.address}</span></p>
                                </div>
                             </div>

                            <button 
                                onClick={handleSchedule}
                                disabled={loading || !date || !slot}
                                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Scheduling...' : 'Confirm Appointment'}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ScheduleDonationModal;
