
import React, { useEffect, useState } from "react";
import { Download, Calendar, MapPin, Award, Droplet, Heart, ChevronRight, Share2 } from "lucide-react";
import api from "../../api/axios";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const History = () => {
    const [donations, setDonations] = useState([]);
    const [stats, setStats] = useState({ totalDonations: 0, livesSaved: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/donations/my-stats');
                if (res.data.success) {
                    setDonations(res.data.data.recentDonations);
                    setStats({
                        totalDonations: res.data.data.totalDonations,
                        livesSaved: res.data.data.livesSaved,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
                toast.error("Could not load donation history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleDownloadCertificate = async (id, certificateId) => {
        const toastId = toast.loading("Generating Certificate...");
        try {
            const response = await api.get(`/donations/${id}/certificate`, {
                responseType: 'blob' 
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate-${certificateId || 'RedGrid'}.pdf`); 
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("Certificate Downloaded!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to download certificate", { id: toastId });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen px-4 pb-20 md:px-8">
            {/* HER0 & STATS */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto mb-16"
            >
                <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-12">
                    <div>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "80px" }}
                            className="h-1 bg-red-600 mb-6 rounded-full"
                        />
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Your <span className="text-red-500">Legacy</span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
                            Every drop tells a story. Here is a record of the lives you've touched and the certificates you've earned.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-2 w-full lg:w-auto">
                        <div className="p-6 md:p-8 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center text-center">
                            <Droplet className="text-red-500 mb-3" size={32} />
                            <div className="text-3xl md:text-4xl font-black text-white mb-1">{stats.totalDonations}</div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Donations</div>
                        </div>
                        <div className="p-6 md:p-8 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-600/10 animate-pulse" />
                            <Heart className="text-red-500 mb-3 relative z-10" size={32} fill="currentColor" />
                            <div className="text-3xl md:text-4xl font-black text-white mb-1 relative z-10">{stats.livesSaved}</div>
                            <div className="text-xs font-bold text-red-400 uppercase tracking-widest relative z-10">Lives Saved</div>
                        </div>
                    </div>
                </div>

                {/* TIMELINE / GRID */}
                <div className="relative">
                    {/* Vertical Line for Desktop Timeline */}
                    {donations.length > 0 && (
                        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2" />
                    )}

                    <div className="space-y-12 lg:space-y-24">
                        {donations.length === 0 ? (
                            <div className="text-center py-32">
                                <Award size={64} className="mx-auto text-zinc-700 mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2">Your journey begins now</h3>
                                <p className="text-zinc-500">Visit a hospital to earn your first badge.</p>
                            </div>
                        ) : (
                            donations.map((donation, index) => (
                                <motion.div 
                                    key={donation._id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex flex-col lg:flex-row gap-8 items-center ${index % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}
                                >
                                    {/* CONTENT CARD */}
                                    <div className="flex-1 w-full">
                                        <div className="group bg-zinc-900 border border-zinc-800 hover:border-red-500/50 rounded-3xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10 relative overflow-hidden">
                                            
                                            {/* Hover Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-white">
                                                            <Award size={20} />
                                                        </div>
                                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                            {donation.certificateId || 'PENDING'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                                                        VERIFIED
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-bold text-white mb-2">
                                                    {donation.hospital?.hospitalProfile?.hospitalName || 'Unknown Hospital'}
                                                </h3>
                                                
                                                <div className="flex flex-col space-y-2 mb-8">
                                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                        <MapPin size={14} className="text-zinc-600" />
                                                        {donation.hospital?.location?.city || 'Location unavailable'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                        <Calendar size={14} className="text-zinc-600" />
                                                        {format(new Date(donation.createdAt), 'MMMM do, yyyy')}
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => handleDownloadCertificate(donation._id, donation.certificateId)}
                                                    className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-95 group/btn"
                                                    disabled={!donation.certificateId}
                                                >
                                                    <Download size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                                    Download Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TIMELINE DOT (Desktop only) */}
                                    <div className="hidden lg:flex flex-none w-12 h-12 rounded-full bg-black border-4 border-zinc-800 items-center justify-center z-10">
                                        <div className="w-3 h-3 bg-red-600 rounded-full" />
                                    </div>

                                    {/* SPACER FOR GRID */}
                                    <div className="flex-1 hidden lg:block" />
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default History;
