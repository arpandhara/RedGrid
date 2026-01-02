
import React, { useEffect, useState } from 'react';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    MoreHorizontal, 
    Search, 
    Filter,
    Calendar,
    Ban
} from 'lucide-react';
import { ActivityCalendar } from 'react-activity-calendar';
import { format, subDays } from 'date-fns';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const RequestStatusBadge = ({ status }) => {
    switch (status) {
        case 'fulfilled':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle2 size={12} /> Fulfilled</span>;
        case 'cancelled':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20"><Ban size={12} /> Cancelled</span>;
        case 'accepted':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20"><CheckCircle2 size={12} /> Accepted</span>;
        default:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock size={12} /> Pending</span>;
    }
};

import useAuthStore from '../../store/useAuthStore'; // Import Auth Store for ID check
import { useSocket } from '../../context/SocketContext'; // Import Socket for real-time

// ... existing imports ...

const ManageRequests = () => {
    const { user } = useAuthStore(); // Get current user
    const { socket } = useSocket(); // Get socket for real-time updates
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState(null); // Track which ID is updating
    const [activityData, setActivityData] = useState([]);

    const fetchRequests = async () => {
        try {
            const res = await api.get(`/requests/hospital${filter !== 'all' ? `?status=${filter}` : ''}`);
            if (res.data.success) {
                setRequests(res.data.data);
                processActivityData(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const processActivityData = (data) => {
        // Generate last 365 days
        const today = new Date();
        const map = new Map();
        
        // Initialize map
        for (let i = 0; i < 365; i++) {
            const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
            map.set(dateStr, 0);
        }

        // Fill counts
        data.forEach(req => {
            const dateStr = format(new Date(req.createdAt), 'yyyy-MM-dd');
            if (map.has(dateStr)) {
                map.set(dateStr, map.get(dateStr) + 1);
            }
        });

        // Convert to array
        const activity = Array.from(map, ([date, count]) => ({
            date,
            count,
            level: Math.min(count, 4) // Level 0-4
        })).reverse();

        setActivityData(activity);
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    // REAL-TIME SOCKET LISTENER for status updates
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data) => {
            console.log("Socket: Status update received, refreshing requests...", data);
            // Delay slightly to ensure DB consistency
            setTimeout(() => {
                fetchRequests();
            }, 500);
        };

        // Listen for notification events (includes status_update type)
        socket.on('notification', handleStatusUpdate);
        // Listen for global request updates
        socket.on('request_update', handleStatusUpdate);

        return () => {
            // Clean up with explicit handler references
            socket.off('notification', handleStatusUpdate);
            socket.off('request_update', handleStatusUpdate);
        };
    }, [socket, filter]); // Include filter to re-subscribe if filter changes

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        setProcessingId(id);
        try {
            const res = await api.put(`/requests/${id}/cancel`);
            if (res.data.success) {
                toast.success("Request cancelled");
                fetchRequests();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel");
        } finally {
            setProcessingId(null);
        }
    };

    const handleAccept = async (id) => {
        setProcessingId(id);
        try {
            const res = await api.put(`/requests/${id}/accept`);
            if (res.data.success) {
                toast.success("Request Accepted!");
                fetchRequests();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
         if (!window.confirm("Reject this request?")) return;
         setProcessingId(id);
         try {
             const res = await api.put(`/requests/${id}/reject`);
             if (res.data.success) {
                 toast.success("Request Rejected");
                 fetchRequests();
             }
         } catch (error) {
             toast.error(error.response?.data?.message || "Failed to reject");
         } finally {
             setProcessingId(null);
         }
    };

    const handleFulfill = async (id, isIncoming) => {
        const msg = isIncoming 
            ? "Mark this request as fulfilled? This will deduct blood units from your inventory."
            : "Mark this request as done? This means you have received the blood.";
            
        if (!window.confirm(msg)) return;
        
        setProcessingId(id);
        try {
            const res = await api.put(`/requests/${id}/fulfill`);
            if (res.data.success) {
                toast.success(isIncoming ? "Request Fulfilled & Inventory Updated" : "Request Marked as Done");
                fetchRequests();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fulfill");
        } finally {
            setProcessingId(null);
        }
   };

    const filteredRequests = requests.filter(r => 
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.bloodGroup.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Request Command Center
                    </h1>
                    <p className="text-zinc-500 mt-2">Track, manage, and analyze your blood requests.</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[120px]">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Total</p>
                        <p className="text-2xl font-black mt-1">{requests.length}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[120px]">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Pending</p>
                        <p className="text-2xl font-black mt-1 text-yellow-500">
                            {requests.filter(r => r.status === 'pending').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* HEATMAP */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 mb-10 overflow-x-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <Calendar size={18} className="text-zinc-400" />
                        Activity Log
                    </h3>
                    <div className="text-xs text-zinc-500">Last 365 Days</div>
                </div>
                <div className="w-full min-w-[800px] flex justify-center">
                    {!loading && (
                        <ActivityCalendar 
                            data={activityData}
                            theme={{
                                light: ['#f0f0f0', '#c4edde', '#7ac7c4', '#f73859', '#384259'],
                                dark: ['#27272a', '#3f3f46', '#7f1d1d', '#b91c1c', '#ef4444'], // Custom Red Theme
                            }}
                            blockSize={12}
                            blockMargin={4}
                            fontSize={12}
                            showWeekdayLabels
                            colorScheme="dark"
                        />
                    )}
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search patient or blood group..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'pending', 'accepted', 'fulfilled', 'cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                filter === f 
                                ? 'bg-white text-black' 
                                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE LIST */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900/50 text-xs uppercase font-bold text-zinc-500">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Patient / Requester</th>
                                <th className="px-6 py-4">Blood Group</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredRequests.map((req) => {
                                const isIncoming = req.recipient?.toString() === user?._id || req.recipient === user?._id;
                                const isUpdating = processingId === req._id;

                                return (
                                <tr key={req._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        {isIncoming ? (
                                            <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded border border-blue-500/20">INCOMING</span>
                                        ) : (
                                            <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded">OUTGOING</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div>{req.patientName}</div>
                                        {isIncoming && req.requester && (
                                            <div className="text-xs text-zinc-500 mt-1">
                                                from: {req.requester.firstName} {req.requester.lastName}
                                                <br/>
                                                <span className="text-zinc-600">{req.requester.phone || 'No Phone'}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-white bg-zinc-800 px-2 py-1 rounded">{req.bloodGroup}</span>
                                        <span className="ml-2 text-xs">{req.unitsNeeded} Units</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                                        <div className="text-[10px] opacity-60">{format(new Date(req.createdAt), 'h:mm a')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RequestStatusBadge status={req.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* INCOMING PENDING */}
                                        {isIncoming && req.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleAccept(req._id)}
                                                    disabled={isUpdating}
                                                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px] flex justify-center"
                                                >
                                                    {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Accept'}
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(req._id)}
                                                    disabled={isUpdating}
                                                    className="bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 text-xs font-bold px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {/* INCOMING ACCEPTED (FULFILL) */}
                                        {isIncoming && req.status === 'accepted' && (
                                            <button 
                                                onClick={() => handleFulfill(req._id)}
                                                disabled={isUpdating}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-end ml-auto gap-2"
                                            >
                                                {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={12} />}
                                                Mark as Done
                                            </button>
                                        )}

                                        {/* OUTGOING PENDING / ACCEPTED */}
                                        {!isIncoming && (req.status === 'pending' || req.status === 'accepted') && (
                                            <div className="flex flex-col gap-2 w-full">
                                                <button 
                                                    onClick={() => handleFulfill(req._id)}
                                                    disabled={isUpdating}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full border border-zinc-700"
                                                >
                                                    {isUpdating && processingId === req._id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={12} />}
                                                    Mark as Done
                                                </button>
                                                <button 
                                                    onClick={() => handleCancel(req._id)}
                                                    disabled={isUpdating}
                                                    className="text-xs text-red-500 hover:text-red-400 font-bold hover:underline disabled:opacity-50 flex items-center justify-center w-full"
                                                >
                                                   Cancel Request
                                                </button>
                                            </div>
                                        )}
                                        
                                        {(req.status === 'fulfilled' || req.status === 'cancelled' || req.status === 'rejected') && (
                                            <span className="text-zinc-600 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                                        No requests found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default ManageRequests;
