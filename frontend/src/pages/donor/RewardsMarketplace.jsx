import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Gift, Heart, Coffee, Star, CreditCard, Ticket, Trophy } from 'lucide-react'; // Added Trophy
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Link } from 'react-router-dom'; // Import Link

const REWARDS = [
    { id: 1, name: 'Cinema Ticket', cost: 500, icon: Ticket, description: 'One free movie ticket at partner cinemas.' },
    { id: 2, name: 'Coffee Voucher', cost: 200, icon: Coffee, description: 'Get a free coffee at Starbucks or Costa.' },
    { id: 3, name: 'Health Checkup', cost: 1000, icon: Heart, description: 'Free basic health checkup at partner hospitals.' },
    { id: 4, name: 'Shopping Discount', cost: 300, icon: CreditCard, description: '10% off at select retail stores.' },
    { id: 5, name: 'Premium Badge', cost: 2000, icon: Star, description: 'Unlock a special profile badge.' },
];

const RewardsMarketplace = () => {
    const { user, refreshUser } = useAuthStore();
    const [loadingId, setLoadingId] = useState(null);

    const handleRedeem = async (reward) => {
        if ((user.donorProfile?.points || 0) < reward.cost) {
            toast.error("Not enough points!");
            return;
        }

        if (!confirm(`Redeem ${reward.name} for ${reward.cost} points?`)) return;

        setLoadingId(reward.id);
        try {
            await api.post('/donations/redeem-points', { 
                points: reward.cost, 
                reason: `Redeemed: ${reward.name}` 
            });
            await refreshUser();
            toast.success(`Redeemed ${reward.name} successfully!`);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Redemption failed");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Rewards Marketplace</h1>
                        <p className="text-zinc-500 mb-4">Redeem your hard-earned points for exciting perks.</p>
                        <Link to="/donor/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-colors text-sm font-bold">
                            <Trophy size={16} className="text-yellow-500" /> View Leaderboard
                        </Link>
                    </div>
                    <div className="bg-gradient-to-r from-purple-900/50 to-zinc-900 border border-purple-500/30 rounded-2xl p-6 flex items-center gap-6">
                        <div>
                            <p className="text-purple-300 text-sm font-medium mb-1">Your Balance</p>
                            <h2 className="text-4xl font-bold text-white">{user.donorProfile?.points || 0} <span className="text-lg text-zinc-500 font-normal">pts</span></h2>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Gift size={32} />
                        </div>
                    </div>
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {REWARDS.map((reward) => (
                        <div key={reward.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors">
                                    <reward.icon size={24} />
                                </div>
                                <span className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full text-sm font-bold text-white">
                                    {reward.cost} pts
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">{reward.name}</h3>
                            <p className="text-zinc-400 text-sm mb-6 flex-1">{reward.description}</p>
                            
                            <button 
                                onClick={() => handleRedeem(reward)}
                                disabled={loadingId === reward.id || (user.donorProfile?.points || 0) < reward.cost}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                    ${(user.donorProfile?.points || 0) >= reward.cost 
                                        ? "bg-white text-black hover:bg-zinc-200" 
                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"}
                                `}
                            >
                                {loadingId === reward.id ? 'Processing...' : 'Redeem Now'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RewardsMarketplace;
