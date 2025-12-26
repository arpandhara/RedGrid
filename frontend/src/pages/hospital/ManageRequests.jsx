
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

const ManageRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
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

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        try {
            const res = await api.put(`/requests/${id}/cancel`);
            if (res.data.success) {
                toast.success("Request cancelled");
                fetchRequests(); // Turn this into local update optimization later
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel");
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
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Blood Group</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredRequests.map((req) => (
                                <tr key={req._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{req.patientName}</td>
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
                                        {(req.status === 'pending' || req.status === 'accepted') && (
                                            <button 
                                                onClick={() => handleCancel(req._id)}
                                                className="text-xs text-red-500 hover:text-red-400 font-bold hover:underline"
                                            >
                                                Cancel Request
                                            </button>
                                        )}
                                        {(req.status === 'fulfilled' || req.status === 'cancelled') && (
                                            <span className="text-zinc-600 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
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
