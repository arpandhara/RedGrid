
import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

const ProfileUpdateModal = ({ isOpen, onClose }) => {
    const { user, checkUser } = useAuthStore();
    const { getToken } = useAuth();
    const [bloodGroup, setBloodGroup] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bloodGroup) return toast.error("Please select a blood group");
        
        setLoading(true);
        try {
            const token = await getToken();
            await api.put('/users/profile', {
                donorData: { bloodGroup }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Allow backend to process, then re-fetch
            await checkUser(token);
            
            toast.success("Profile Updated!");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
                
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 ring-1 ring-red-500/20">
                        <Activity size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Blood Group Missing</h2>
                    <p className="text-zinc-400 text-sm mt-1">Please select your blood group to activate your donor profile.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-4 gap-2">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <button
                                key={bg}
                                type="button"
                                onClick={() => setBloodGroup(bg)}
                                className={`py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
                                    bloodGroup === bg 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105 ring-2 ring-red-400 ring-offset-2 ring-offset-zinc-900' 
                                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-700/50'
                                }`}
                            >
                                {bg}
                            </button>
                        ))}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Complete Profile</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileUpdateModal;
