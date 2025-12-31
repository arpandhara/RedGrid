import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Trophy, Medal, MapPin, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/donations/leaderboard');
                if (res.data.success) {
                    setLeaders(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load leaderboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    const topThree = leaders.slice(0, 3);
    const rest = leaders.slice(3);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate(-1)} 
                    className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent inline-flex items-center gap-3">
                        <Trophy className="text-yellow-500" /> Organization Leaderboard
                    </h1>
                    <p className="text-zinc-500 mt-2">Celebrating the top life-saving organizations.</p>
                </div>

                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 items-end mb-12 h-64">
                         {/* 2nd Place */}
                         {topThree[1] && <div className="flex flex-col items-center">
                            <div className="mb-4 text-center">
                                <p className="font-bold text-lg truncate max-w-[150px]">{topThree[1].orgName}</p>
                                <p className="text-zinc-500 text-xs">{topThree[1].totalDonations} Donations</p>
                            </div>
                            <div className="w-full h-40 bg-zinc-800 rounded-t-2xl relative flex items-start justify-center pt-4 border-t border-x border-zinc-700">
                                <span className="text-4xl font-bold text-zinc-600">2</span>
                            </div>
                         </div>}
                         
                         {/* 1st Place */}
                         {topThree[0] && <div className="flex flex-col items-center z-10 -mx-2">
                             <div className="mb-4 text-center">
                                <Award size={32} className="text-yellow-500 mx-auto mb-2" />
                                <p className="font-bold text-xl truncate max-w-[180px] text-yellow-500">{topThree[0].orgName}</p>
                                <p className="text-zinc-400 text-sm">{topThree[0].totalDonations} Donations</p>
                            </div>
                            <div className="w-full h-56 bg-gradient-to-b from-yellow-500/20 to-zinc-900 rounded-t-2xl relative flex items-start justify-center pt-4 border-t border-x border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                <span className="text-5xl font-bold text-yellow-500">1</span>
                            </div>
                         </div>}

                         {/* 3rd Place */}
                         {topThree[2] && <div className="flex flex-col items-center">
                             <div className="mb-4 text-center">
                                <p className="font-bold text-lg truncate max-w-[150px]">{topThree[2].orgName}</p>
                                <p className="text-zinc-500 text-xs">{topThree[2].totalDonations} Donations</p>
                            </div>
                            <div className="w-full h-32 bg-zinc-800 rounded-t-2xl relative flex items-start justify-center pt-4 border-t border-x border-zinc-700">
                                <span className="text-4xl font-bold text-zinc-600">3</span>
                            </div>
                         </div>}
                    </div>
                )}

                {/* The Rest List */}
                <div className="space-y-4">
                    {rest.map((org, index) => (
                        <div key={org._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-zinc-500 font-mono w-6 text-center">{index + 4}</span>
                                <div>
                                    <h3 className="font-bold text-white">{org.orgName}</h3>
                                    <p className="text-zinc-500 text-xs flex items-center gap-1">
                                        <MapPin size={10} /> {org.city || 'Unknown Location'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-emerald-500 text-lg">{org.totalDonations}</span>
                                <span className="text-zinc-600 text-xs block">donations</span>
                            </div>
                        </div>
                    ))}
                    {rest.length === 0 && topThree.length === 0 && (
                        <div className="text-center py-10 text-zinc-500">
                            No data yet. Organizations, start your camps!
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Leaderboard;
