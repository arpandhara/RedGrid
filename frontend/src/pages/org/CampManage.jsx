
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    MoreHorizontal, 
    Search, 
    Filter,
    Calendar,
    Ban,
    Tent
} from 'lucide-react';
import { ActivityCalendar } from 'react-activity-calendar';
import { format, subDays } from 'date-fns';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

// Reusing the Status Badge Component
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

const CampManage = () => {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [activityData, setActivityData] = useState([]);

    const { getToken } = useAuth();

    const fetchRequests = async () => {
        try {
            const token = await getToken();
            
            // Parallel Fetch
            const [reqRes, apptRes] = await Promise.all([
                api.get(`/requests/hospital${filter !== 'all' ? `?status=${filter}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
                api.get(`/donations/appointments`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            let combined = [];

            // 1. Process Requests
            if (reqRes.data.success && Array.isArray(reqRes.data.data)) {
                combined = reqRes.data.data.map(r => ({ ...r, type: 'request' }));
            }

            // 2. Process Appointments (Donations)
            if (apptRes.data.success && Array.isArray(apptRes.data.data)) {
                const appointments = apptRes.data.data.map(a => ({
                    _id: a._id,
                    type: 'appointment',
                    patientName: `Donor: ${a.donor?.firstName} ${a.donor?.lastName}`,
                    bloodGroup: a.bloodGroup || a.donor?.donorProfile?.bloodGroup,
                    unitsNeeded: 1,
                    createdAt: a.donationDate,
                    status: a.status === 'pending' ? 'pending' : 'fulfilled',
                    donorId: a.donor?._id,
                    original: a
                }));

                const statusFilter = filter === 'accepted' ? 'pending' : filter; 

                if (filter !== 'all') {
                     combined = [...combined, ...appointments.filter(a => a.status === statusFilter)];
                } else {
                    combined = [...combined, ...appointments];
                }
            }
            
            // Sort
            combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setRequests(combined);
            processActivityData(combined);

        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };



    const processActivityData = (data) => {
        const today = new Date();
        const map = new Map();
        for (let i = 0; i < 365; i++) {
            const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
            map.set(dateStr, 0);
        }
        data.forEach(req => {
            const dateStr = format(new Date(req.createdAt), 'yyyy-MM-dd');
            if (map.has(dateStr)) {
                map.set(dateStr, map.get(dateStr) + 1);
            }
        });
        const activity = Array.from(map, ([date, count]) => ({
            date,
            count,
            level: Math.min(count, 4)
        })).reverse();
        setActivityData(activity);
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    // --- ACTIONS ---
    const handleCancel = async (item) => {
        if (!window.confirm("Are you sure you want to cancel this?")) return;
        setProcessingId(item._id);
        
        try {
            let res;
            if (item.type === 'request') {
                res = await api.put(`/requests/${item._id}/cancel`);
            } else {
                // Determine logic for cancelling appointment? 
                // Currently no direct endpoint for Org to cancel booking, 
                // but usually we just don't verify it or reject it (implement if needed)
                // For now, let's assume we can't cancel appointment via this button easily without new endpoint
                // or we use the 'verify' endpoint with 'rejected'?
                toast.error("Cancellation of appointments not yet supported. Please ignore.");
                return;
            }

            if (res?.data?.success) {
                toast.success("Cancelled successfully");
                fetchRequests();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel");
        } finally {
            setProcessingId(null);
        }
    };

    const handleFulfill = async (item) => {
        const msg = item.type === 'request' 
            ? "Mark this drive as completed?" 
            : "Verify this donation as completed?";
            
        if (!window.confirm(msg)) return;
        setProcessingId(item._id);
        
        try {
            if (item.type === 'request') {
                const res = await api.put(`/requests/${item._id}/fulfill`);
                 if (res.data.success) {
                    toast.success("Drive Completed");
                    fetchRequests();
                }
            } else {
                // Verify Appointment
                const payload = {
                    donorId: item.donorId,
                    timestamp: Date.now()
                };
                const res = await api.post('/donations/verify', payload);
                 if (res.data.success) {
                    toast.success("Donation Verified");
                    fetchRequests();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(r => 
        r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        r.bloodGroup?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-20 font-sans">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                         <span className="p-2 bg-red-600 rounded-lg"><Tent size={24} className="text-white"/></span>
                         Camp Request Manager
                    </h1>
                    <p className="text-zinc-500 mt-2 ml-1">Manage your blood donation drives and requests.</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[120px]">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Total Events</p>
                        <p className="text-2xl font-black mt-1">{requests.length}</p>
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
                                dark: ['#27272a', '#3f3f46', '#7f1d1d', '#b91c1c', '#ef4444'],
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
                        placeholder="Search by event name or blood group..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'pending', 'fulfilled', 'cancelled'].map(f => (
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
                                <th className="px-6 py-4">Event / Patient</th>
                                <th className="px-6 py-4">Requirement</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredRequests.map((req) => {
                                const isUpdating = processingId === req._id;
                                return (
                                <tr key={req._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">
                                        {req.patientName}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white bg-zinc-800 px-2 py-1 rounded">{req.bloodGroup}</span>
                                            <span className="text-xs">{req.unitsNeeded} Units</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                                        <div className="text-[10px] opacity-60">{format(new Date(req.createdAt), 'h:mm a')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RequestStatusBadge status={req.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Actions for Pending Requests */}
                                        {(req.status === 'pending') && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleFulfill(req)}
                                                    disabled={isUpdating}
                                                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                >
                                                     {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={12} />}
                                                     Complete
                                                </button>
                                                <button 
                                                    onClick={() => handleCancel(req)}
                                                    disabled={isUpdating}
                                                    className="bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 text-xs font-bold px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Actions for Fulfilled/Cancelled */}
                                        {(req.status === 'fulfilled' || req.status === 'cancelled') && (
                                            <span className="text-zinc-600 text-xs italic">No actions available</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                                        No requests found.
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

export default CampManage;
