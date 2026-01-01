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
           
           // Parallel Fetch: Request Responses & Direct Appointments
           const [reqRes, apptRes] = await Promise.all([
               api.get('/requests/hospital?status=accepted', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/donations/appointments?status=pending', { headers: { Authorization: `Bearer ${token}` } })
           ]);
           
           const incomingList = [];

           // Process Requests
           if (reqRes.data.success) {
               reqRes.data.data.forEach(req => {
                   if (req.acceptedBy && req.acceptedBy.length > 0) {
                       req.acceptedBy.forEach(acceptance => {
                           if (acceptance.status === 'accepted') {
                               incomingList.push({
                                   _id: acceptance._id, 
                                   donor: acceptance.donorId,
                                   request: req,
                                   timestamp: acceptance.acceptedAt,
                                   type: 'request'
                               });
                           }
                       });
                   }
               });
           }
           
           // Process Appointments
           if (apptRes.data.success) {
               apptRes.data.data.forEach(appt => {
                   incomingList.push({
                       _id: appt._id,
                       donor: appt.donor,
                       request: null,
                       timestamp: appt.donationDate,
                       type: 'appointment'
                   });
               });
           }
           
           // Sort by timestamp (Soonest first) - though appointments date is future, acceptance date is past
           // Let's sort by relevant date
           incomingList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

           setRequests(incomingList);

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
            if (data.type === 'status_update' || data.type === 'new_appointment') {
                console.log("New donor / appointment! Refreshing list...");
                // Re-fetch list to show new donor
                fetchIncoming();
            }
        };
    
        socket.on('notification', handleUpdate);
    
        return () => {
            socket.off('notification', handleUpdate);
        };
      }, [socket]);

    const handleComplete = async (item) => {
        try {
            // "Manual" verification without QR scanning interactions
            // We pass the required fields to the existing endpoint
            
            const payload = {
                donorId: item.donor._id, 
                timestamp: Date.now()
            };

            if (item.type === 'request') {
                payload.requestId = item.request._id;
            } 
            // If appointment, we don't pass requestId, verifyDonation will find pending appt by donorId

            await api.post('/donations/verify', payload);
            
            toast.success("Donation marked as completed!");
            // Remove from list
            setRequests(prev => prev.filter(r => r._id !== item._id));
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to complete donation");
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
                        <div key={item._id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col gap-3">
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
                                        {item.type === 'appointment' ? 'Scheduled Visit' : `For: ${item.request?.patientName}`}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                                    <button 
                                    onClick={() => handleComplete(item)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-lg shadow-green-900/20"
                                    >
                                        <CheckCircle2 size={14} /> Mark Done
                                    </button>
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-900 px-2 py-2 rounded-lg">
                                        <Clock size={12} /> 
                                        {item.type === 'appointment' ? new Date(item.timestamp).toLocaleDateString() : 'Active Request'}
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
