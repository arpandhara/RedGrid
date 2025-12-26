import React, { useState, useEffect } from 'react';
import { X, Send, Check, XCircle, MapPin, Droplet, User as UserIcon, Activity, Calendar } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet Default Icon
import iconMarker2x from 'leaflet/dist/images/marker-icon-2x.png';
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconMarker2x,
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
});

const RequestModal = ({ isOpen, onClose, target }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !target) return null;

    const handleSend = async () => {
        if (!target) return;
        setLoading(true);
        try {
            if (target?.type === 'request') {
                const res = await api.put(`/requests/${target._id}/accept`);
                if (res.data.success) {
                    toast.success("Thank you! Hospital notified.");
                    onClose();
                }
            } else {
                if (!reason.trim()) {
                    toast.error("Please enter a reason");
                    setLoading(false);
                    return;
                }
                const res = await api.post('/requests/direct', {
                    recipientId: target?._id,
                    recipientType: 'User',
                    bloodGroup: target?.bloodGroup,
                    reason,
                    patientDetails: { name: 'Self/Family' }
                });
                if (res.data.success) {
                    toast.success("Request sent successfully!");
                    onClose();
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!target) return;
        setLoading(true);
        try {
             const res = await api.put(`/requests/${target._id}/reject`);
             if (res.data.success) {
                 toast.success("Request rejected.");
                 onClose();
             }
        } catch (error) {
             console.error("Reject Error:", error);
             toast.error(error.response?.data?.message || "Failed to reject request");
        } finally {
             setLoading(false);
        }
    };

    const isRespondingToRequest = target.type === 'request';
    
    // Parse Coordinates: GeoJSON [lng, lat] -> Leaflet [lat, lng]
    const position = target.location?.coordinates 
        ? [target.location.coordinates[1], target.location.coordinates[0]] 
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-4">
            <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg relative shadow-2xl overflow-hidden flex flex-col ${isRespondingToRequest ? 'h-[85vh]' : 'h-auto'}`}>
                
                {/* Header Image or Map */}
                {isRespondingToRequest && position ? (
                    <div className="h-48 w-full relative z-0">
                        <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            <Marker position={position} />
                        </MapContainer>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <div className="h-24 bg-gradient-to-r from-red-900/20 to-zinc-900 w-full relative">
                        <div className="absolute -bottom-6 left-6 w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border-4 border-zinc-900 shadow-xl">
                            <Droplet className={`w-8 h-8 ${target.bloodGroup?.includes('+') ? 'text-red-500' : 'text-rose-500'}`} fill="currentColor" />
                        </div>
                    </div>
                )}

                <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-zinc-800 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md">
                    <X size={16} />
                </button>

                <div className="p-6 pt-8 flex-1 overflow-y-auto">
                    {!isRespondingToRequest && <div className="mt-8" />} {/* Spacer if no map */}
                    
                    <h2 className="text-2xl font-bold text-white mb-1">{target.name}</h2>
                    <p className="text-zinc-500 text-sm mb-6 flex items-center gap-2">
                        {isRespondingToRequest ? 'is requesting help' : 'Potential Donor'}
                    </p>

                    {/* KEY STATS GRID */}
                    {isRespondingToRequest && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Patient</p>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <UserIcon size={14} className="text-blue-500" /> {target.patientName || 'Unknown'}
                                </div>
                            </div>
                            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Units Needed</p>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <Droplet size={14} className="text-red-500" /> {target.unitsNeeded || 1} Units
                                </div>
                            </div>
                            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Urgency</p>
                                <div className={`flex items-center gap-2 font-bold uppercase text-xs ${target.urgency === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
                                    <Activity size={14} /> {target.urgency || 'Moderate'}
                                </div>
                            </div>
                            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Blood Group</p>
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded">{target.bloodGroup}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {!isRespondingToRequest && (
                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Why do you need this?</label>
                                <textarea 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-sm focus:border-red-500 focus:outline-none transition-colors h-32 resize-none placeholder-zinc-600"
                                    placeholder="Briefly describe the emergency..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        )}

                        {isRespondingToRequest && (
                             <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-xs text-red-300/80 leading-relaxed text-center">
                                By accepting, you commit to helping <strong>{target.patientName}</strong>. The hospital will be notified immediately.
                             </div>
                        )}
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky bottom-0 z-20">
                    <div className="flex gap-3">
                        {isRespondingToRequest && target.isDirect && (
                            <button 
                                onClick={handleReject}
                                disabled={loading}
                                className="px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transition-transform active:scale-95"
                            >
                                <XCircle size={18} /> Reject
                            </button>
                        )}
                        <button 
                            onClick={handleSend}
                            disabled={loading}
                            className={`flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
                            <>{isRespondingToRequest ? <Check size={18} /> : <Send size={18} />} {isRespondingToRequest ? 'Accept Request' : 'Send Request'}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestModal;
