import React from 'react';
import { motion } from 'framer-motion';
import { Ghost, SearchX, BellOff, ClipboardList } from 'lucide-react';

const icons = {
    ghost: Ghost,
    search: SearchX,
    bell: BellOff,
    list: ClipboardList
};

const EmptyState = ({ 
    title = "Nothing to see here", 
    message = "It looks like there is no data to display at the moment.", 
    icon = "ghost",
    actionLabel,
    onAction
}) => {
    const IconComponent = icons[icon] || Ghost;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <div className="bg-zinc-900/50 p-6 rounded-full mb-6 border border-zinc-800">
                <IconComponent size={48} className="text-zinc-600" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
                {message}
            </p>

            {actionLabel && onAction && (
                <button 
                    onClick={onAction}
                    className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
