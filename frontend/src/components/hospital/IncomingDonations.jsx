import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { User, CheckCircle2, Clock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { useSocket } from '../../context/SocketContext';

const IncomingDonations = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();
    const { socket } = useSocket();

    const fetchIncoming = async () => {
       try {
           const token = await getToken();
           // Fetch all requests that are 'accepted' or 'pending' but have donors?
           // Actually, backend returns requests created by hospital.
           // We filter for meaningful ones.
           const res = await api.get('/requests/hospital?status=accepted', {
               headers: { Authorization: `Bearer ${token}` }
           });
           
           if (res.data.success) {
               // Flatten logic: We want a list of DONORS who are coming.
               // Each request might have multiple donors (in future).
               // Currently, 'acceptedBy' array holds them.
               
               const incomingList = [];
               res.data.data.forEach(req => {
                   if (req.acceptedBy && req.acceptedBy.length > 0) {
                       req.acceptedBy.forEach(acceptance => {
                           if (acceptance.status === 'accepted') {
                               incomingList.push({
                                   _id: acceptance._id, // unique sub-doc id
                                   donor: acceptance.donorId,
                                   request: req,
                                   timestamp: acceptance.acceptedAt
                               });
                           }
                       });
                   }
               });
               
               setRequests(incomingList);
           }
       } catch (error) {
           console.error("Failed to fetch incoming donations", error);
       } finally {
           setLoading(false);
       }
    };

    useEffect(() => {
        fetchIncoming();
    }, []);

    // REAL-TIME LISTENER
    useEffect(() => {
        if (!socket) return;
    
        const handleUpdate = (data) => {
            // Check if notification is about a donor accepting a request
            // data.type from acceptRequest is 'status_update'
            if (data.type === 'status_update') {
                console.log("New donor accepted! Refreshing list...");
                // Re-fetch list to show new donor
                fetchIncoming();
            }
        };
    
        socket.on('notification', handleUpdate);
    
        return () => {
            socket.off('notification', handleUpdate);
        };
      }, [socket]);

    const handleComplete = async (requestId, donorId) => {
        try {
            // "Manual" verification without QR scanning interactions
            // We pass the required fields to the existing endpoint
            await api.post('/donations/verify', {
                donorId, 
                requestId,
                timestamp: Date.now() // Emulate a current scan
            });
            
            toast.success("Donation marked as completed!");
            // Remove from list
            setRequests(prev => prev.filter(r => r.request._id !== requestId || r.donor._id !== donorId));
        } catch (error) {
            console.error(error);
            toast.error("Failed to complete donation");
        }
    };

    if (loading) return <div className="h-64 bg-zinc-900 rounded-xl animate-pulse" />;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="text-blue-500" size={20} />
                Incoming Donors
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{requests.length}</span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 max-h-[400px]">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                        <CheckCircle2 size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">No donors have accepted requests yet.</p>
                    </div>
                ) : (

                    requests.map(item => (
                        <div key={`${item.request._id}-${item.donor._id}`} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col gap-3">
                            {/* Header: Donor Info */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm">
                                        {item.donor?.donorProfile?.bloodGroup || '?'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            {item.donor?.firstName} {item.donor?.lastName}
                                        </p>
                                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Phone size={10} /> {item.donor?.phone || 'No Phone'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                                        For: {item.request?.patientName}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                                    <button 
                                    onClick={() => handleComplete(item.request._id, item.donor._id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-lg shadow-green-900/20"
                                    >
                                        <CheckCircle2 size={14} /> Mark Done
                                    </button>
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-900 px-2 py-2 rounded-lg">
                                        <Clock size={12} /> Pending Arrival
                                    </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default IncomingDonations;
