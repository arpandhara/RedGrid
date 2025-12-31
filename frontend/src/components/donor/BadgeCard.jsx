import React from 'react';
import { Droplet, Heart, Shield, Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
    droplet: Droplet,
    heart: Heart,
    shield: Shield,
    crown: Crown
};

const BadgeCard = ({ badge, locked = false }) => {
    const Icon = iconMap[badge.icon] || Droplet;

    if (locked) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 opacity-70 grayscale">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Lock size={16} className="text-zinc-500" />
                </div>
                <div>
                    <h4 className="font-bold text-zinc-500 text-sm">{badge.name}</h4>
                    <p className="text-xs text-zinc-600">Locked</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 hover:border-red-500/50 rounded-xl p-4 flex items-center gap-4 group transition-colors relative overflow-hidden"
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                badge.code === 'LEGEND' ? 'bg-yellow-500/20 text-yellow-500' :
                badge.code === 'GUARDIAN' ? 'bg-purple-500/20 text-purple-500' :
                badge.code === 'LIFE_SAVER' ? 'bg-red-500/20 text-red-500' :
                'bg-blue-500/20 text-blue-500'
            }`}>
                <Icon size={20} />
            </div>
            
            <div className="z-10">
                <h4 className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">{badge.name}</h4>
                <p className="text-[10px] text-zinc-500 leading-tight max-w-[120px]">{badge.description}</p>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
        </motion.div>
    );
};

export default BadgeCard;
