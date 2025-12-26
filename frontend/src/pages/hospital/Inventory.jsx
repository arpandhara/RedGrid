
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Droplet, 
  AlertTriangle, 
  Activity,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from "@clerk/clerk-react";
import api from '../../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SAFE_LEVEL = 10;
const CRITICAL_LEVEL = 5;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 }
};

const Inventory = () => {
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); 
  const { getToken } = useAuth();

  const fetchInventory = async () => {
    try {
      const token = await getToken();
      const res = await api.get('/hospital/inventory', {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const map = {};
        res.data.data.forEach(item => {
            map[item.bloodGroup] = item.quantity;
        });
        setInventory(map);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdate = async (bloodGroup, type) => {
    setUpdating(bloodGroup);
    try {
        const token = await getToken();
        const res = await api.put('/hospital/inventory', {
            bloodGroup,
            type,
            quantity: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            setInventory(prev => ({
                ...prev,
                [bloodGroup]: res.data.data.quantity
            }));
            if (type === 'add') toast.success(`Added 1 unit to ${bloodGroup}`);
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Update failed");
    } finally {
        setUpdating(null);
    }
  };

  const getStatusColor = (qty) => {
      if (qty >= SAFE_LEVEL) return 'text-emerald-400';
      if (qty >= CRITICAL_LEVEL) return 'text-orange-400';
      return 'text-red-500';
  };
  
  const getFillColor = (qty) => {
      if (qty >= SAFE_LEVEL) return 'bg-emerald-500';
      if (qty >= CRITICAL_LEVEL) return 'bg-orange-500';
      return 'bg-red-600';
  };

  const getShadowColor = (qty) => {
      if (qty >= SAFE_LEVEL) return 'shadow-emerald-500/20';
      if (qty >= CRITICAL_LEVEL) return 'shadow-orange-500/20';
      return 'shadow-red-500/20';
  };

  const getTotalUnits = () => Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 lg:p-12 pb-24 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between mb-8 md:mb-12 gap-6">
        <div>
           <motion.div 
             initial={{ opacity: 0, x: -20 }} 
             animate={{ opacity: 1, x: 0 }}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4 backdrop-blur-md"
           >
               <Activity size={14} className="text-red-500" /> Live Inventory
           </motion.div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent leading-tight">
               Blood Stock
           </h1>
           <p className="text-zinc-500 mt-2 max-w-md text-sm md:text-lg">
               Manage your hospital's real-time inventory levels.
           </p>
        </div>

        {/* STATS WIDGETS */}
        <div className="flex flex-wrap gap-3 md:gap-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 bg-zinc-900/30 border border-white/5 rounded-2xl p-4 md:p-5 min-w-[140px] md:min-w-[160px] backdrop-blur-md"
            >
                <p className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Total Units</p>
                <div className="text-3xl md:text-4xl font-black text-white">{getTotalUnits()}</div>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1 bg-zinc-900/30 border border-white/5 rounded-2xl p-4 md:p-5 min-w-[140px] md:min-w-[160px] backdrop-blur-md relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                <p className="text-[10px] md:text-xs text-red-400/80 uppercase font-bold tracking-wider mb-2 relative z-10">Critical Alerts</p>
                <div className="text-3xl md:text-4xl font-black text-red-500 relative z-10">
                    {BLOOD_GROUPS.filter(bg => (inventory[bg] || 0) < CRITICAL_LEVEL).length}
                </div>
            </motion.div>
        </div>
      </div>

      {/* GRID */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6 relative z-10"
      >
         {BLOOD_GROUPS.map((bg) => {
             const qty = inventory[bg] || 0;
             const isCritical = qty < CRITICAL_LEVEL;
             const fillPercentage = Math.min((qty / 15) * 100, 100); 

             return (
                 <motion.div 
                    key={bg} 
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className={`
                        relative overflow-hidden rounded-[2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md
                        transition-all duration-300 group shadow-lg ${getShadowColor(qty)}
                    `}
                 >
                     
                     {/* LIQUID FILL BACKGROUND */}
                     <motion.div 
                        className={`absolute bottom-0 left-0 w-full opacity-[0.15] ${getFillColor(qty)}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${fillPercentage}%` }}
                        transition={{ type: "spring", stiffness: 40, damping: 15 }}
                     />
                     
                     {/* GLOW GRADIENT */}
                     <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] pointer-events-none opacity-20 ${getFillColor(qty)}`} />

                     <div className="p-5 md:p-7 relative z-10 flex flex-col h-full min-h-[280px] md:min-h-[320px]">
                         {/* TOP ROW */}
                         <div className="flex justify-between items-start">
                             <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white/90">{bg.replace('+', '').replace('-', '')}<span className="text-2xl md:text-3xl align-top opacity-50">{bg.includes('+') ? '+' : '-'}</span></h2>
                             {isCritical && (
                                 <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 md:p-2.5 rounded-full shadow-lg shadow-red-500/20"
                                 >
                                     <AlertTriangle size={16} md:size={18} />
                                 </motion.div>
                             )}
                         </div>

                         {/* MIDDLE: QUANTITY */}
                         <div className="flex-1 flex flex-col justify-center my-4 md:my-6">
                            <div className="flex items-baseline gap-2">
                                 <motion.span 
                                    key={qty} 
                                    initial={{ scale: 1.2, filter: 'blur(4px)' }}
                                    animate={{ scale: 1, filter: 'blur(0px)' }}
                                    className={`text-6xl md:text-7xl font-bold tracking-tighter ${qty < CRITICAL_LEVEL ? 'text-red-500' : 'text-white'}`}
                                 >
                                     {qty}
                                 </motion.span>
                                 <span className="text-zinc-500 font-medium text-lg">Units</span>
                            </div>
                            <p className={`text-xs font-bold tracking-widest uppercase mt-2 pl-1 ${getStatusColor(qty)}`}>
                                 {qty < CRITICAL_LEVEL ? 'Critical Low' : qty < SAFE_LEVEL ? 'Moderate Stock' : 'Healthy Stock'}
                            </p>
                         </div>

                         {/* ACTIONS */}
                         <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                             <motion.button 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleUpdate(bg, 'remove')}
                                disabled={updating === bg || qty === 0}
                                className="h-12 w-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center hover:bg-black/60 hover:border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 hover:text-white"
                             >
                                 <Minus size={20} />
                             </motion.button>
                             
                             <div className="flex-1 text-center">
                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                     <motion.div 
                                        className={`h-full ${getFillColor(qty)}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${fillPercentage}%` }}
                                        transition={{ type: "spring", stiffness: 40, damping: 15 }}
                                     />
                                </div>
                             </div>

                             <motion.button 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleUpdate(bg, 'add')}
                                disabled={updating === bg}
                                className="h-12 w-16 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <Plus size={20} />
                             </motion.button>
                         </div>
                     </div>
                 </motion.div>
             );
         })}
      </motion.div>
    </div>
  );
};

export default Inventory;
