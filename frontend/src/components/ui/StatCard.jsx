import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const StatCard = ({ icon: Icon, label, value, subtext, type = "neutral", delay = 0 }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(cardRef.current, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, delay: delay, ease: "power2.out" }
        );
    }, [delay]);

    const getDesigns = () => {
        switch (type) {
            case 'critical': 
                return 'from-zinc-900 to-zinc-950 border-zinc-800 hover:border-red-500/30 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]';
            case 'success': 
                return 'from-zinc-900 to-zinc-950 border-zinc-800 hover:border-emerald-500/30 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]';
            case 'info': 
                return 'from-zinc-900 to-zinc-950 border-zinc-800 hover:border-blue-500/30 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]';
            default: 
                return 'from-zinc-900 to-zinc-950 border-zinc-800 hover:border-zinc-700';
        }
    };

    return (
        <div 
            ref={cardRef} 
            className={`
                relative overflow-hidden rounded-3xl p-6 border bg-gradient-to-b transition-all duration-300 group
                ${getDesigns()}
            `}
        >
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-white group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <Icon size={24} strokeWidth={1.5} />
                    </div>
                </div>
                
                <div>
                    <h3 className="text-4xl font-bold text-white mb-1">
                        {value}
                    </h3>
                    <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
                    {subtext && <p className="text-xs text-zinc-500 mt-2 font-medium">{subtext}</p>}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
