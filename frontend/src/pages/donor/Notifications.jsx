import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Droplet, Ticket, X, MapPin } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import DonationTicket from '../../components/donor/DonationTicket';
import MapModal from '../../components/common/MapModal';
import { useSocket } from '../../context/SocketContext';
import useAuthStore from '../../store/useAuthStore'; // Fix: Import useAuthStore

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewLocation, setViewLocation] = useState(null); // { location: {}, name: '' }
  const { socket, markRead } = useSocket();
  const { user } = useAuthStore(); // Need user to check if I am the one who accepted

  // 1. Fetch Notifications on Load
  useEffect(() => {
    fetchNotifications();
    if (markRead) markRead(); // Clear badge on visit
  }, []);

  // 2. Listen for Real-Time Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
        // Re-fetch to get populated data (requester details etc)
        fetchNotifications();
    };

    socket.on('notification', handleNewNotification);

    return () => {
        socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      // Don't set loading=true here to avoid flickering UI on updates
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Only relevant for initial load
    }
  };

  // 2. Mark Single as Read
  const handleMarkRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Mark All as Read
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  // 4. Accept Request
  const handleAcceptRequest = async (requestId, notificationId) => {
    try {
        await api.put(`/requests/${requestId}/accept`);
        toast.success("Request Accepted! Your ticket is generated.");
        
        // Optimistic Update: Mark as Read & Show Accepted Status
        setNotifications(prev => prev.map(n => {
            if (n._id === notificationId) {
                return { 
                    ...n, 
                    isRead: true,
                    relatedRequestId: { ...n.relatedRequestId, status: 'accepted' }
                };
            }
            return n;
        }));
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to accept request");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="bg-red-500/10 p-2 rounded-xl text-red-500">
                <Bell className="w-6 h-6" />
            </span>
            Notifications
          </h1>
          <p className="text-zinc-400 text-sm mt-2 ml-1">
            Stay updated with real-time alerts.
          </p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="animate-spin mb-4">
                <Bell className="w-8 h-8 opacity-20" />
            </div>
            Loading alerts...
        </div>
      ) : (
      <div className="space-y-4">
        <AnimatePresence>
        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed"
          >
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                 <Bell className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 font-medium">No new notifications</p>
          </motion.div>
        ) : (
          notifications.map((n, index) => (
            <motion.div 
              key={n._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-5 md:p-6 rounded-2xl border transition-all duration-300 group ${
                n.isRead 
                  ? 'bg-zinc-900/30 border-zinc-800/30' 
                  : 'bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-red-500/20 shadow-lg shadow-red-900/5'
              }`}
            >
              <div className="flex gap-4 md:gap-5">
                {/* Icon Column */}
                <div className="shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        n.type === 'blood_request' 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20 text-white' 
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                        {n.type === 'blood_request' ? <Droplet size={18} fill="currentColor" /> : <Bell size={18} />}
                    </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`font-semibold text-base md:text-lg mb-1 truncate pr-8 ${n.isRead ? 'text-zinc-400' : 'text-white'}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                       <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl mb-4">
                    {n.message}
                  </p>

                  {/* RICH REQUEST DETAILS CARD */}
                  {n.relatedRequestId && n.type === 'blood_request' && (
                    <div className="bg-black/20 border border-white/5 rounded-xl p-3 md:p-4 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Hospital</p>
                            <p className="text-sm text-white font-medium break-words leading-tight">
                                {n.relatedRequestId.requester?.hospitalProfile?.hospitalName || "Unknown"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Urgency</p>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                                n.relatedRequestId.urgency === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                                'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}>
                                {n.relatedRequestId.urgency === 'critical' && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span></span>}
                                {n.relatedRequestId.urgency}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Units</p>
                            <p className="text-sm text-white font-medium">{n.relatedRequestId.unitsNeeded}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Distance</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-white font-medium">~2 km</p>
                                {n.relatedRequestId.requester?.location && (
                                    <button 
                                        onClick={() => setViewLocation({
                                            location: n.relatedRequestId.requester.location,
                                            name: n.relatedRequestId.requester.hospitalProfile?.hospitalName
                                        })}
                                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                    >
                                        <MapPin size={10} /> View
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                  )}
                  
                  {/* FOOTER ACTIONS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-zinc-600 font-medium flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded w-fit">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        {!n.isRead && (
                        <button 
                            onClick={(e) => handleMarkRead(n._id, e)}
                            className="text-xs font-medium text-zinc-500 hover:text-white transition-colors px-2 py-1"
                        >
                            Mark Read
                        </button>
                        )}
                        
                        {/* ACCEPT / VIEW TICKET BUTTONS */}
                        {n.relatedRequestId && n.type === 'blood_request' && (
                            <>
                                {n.relatedRequestId.status === 'pending' && (
                                    <button
                                        onClick={() => handleAcceptRequest(n.relatedRequestId._id, n._id)}
                                        className="flex-1 sm:flex-none bg-white hover:bg-zinc-200 text-black text-xs px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95 shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                                    >
                                        <Check size={14} strokeWidth={3} /> Accept
                                    </button>
                                )}
                                
                                {n.relatedRequestId.status === 'accepted' && (
                                    <div className="flex items-center gap-2">
                                        {/* Check if *I* accepted it */}
                                        {n.relatedRequestId.acceptedBy?.some(entry => entry.donorId === user._id) ? (
                                            <>
                                                <span className="text-xs font-bold text-green-500 px-2 hidden sm:inline">Accepted</span>
                                                <button
                                                    onClick={() => setSelectedTicket(n.relatedRequestId)}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700 flex items-center gap-2"
                                                >
                                                    <Ticket size={14} /> View Ticket
                                                </button>
                                            </>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg opacity-75">
                                                <Check size={12} /> Fulfilled by others
                                            </span>
                                        )}
                                    </div>
                                )}

                                {n.relatedRequestId.status === 'fulfilled' && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                                        <Check size={12} /> Fulfilled
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        </AnimatePresence>
      </div>
      )}

      {/* MAP MODAL */}
      <MapModal 
        isOpen={!!viewLocation}
        onClose={() => setViewLocation(null)}
        location={viewLocation?.location}
        hospitalName={viewLocation?.name}
      />

      {/* TICKET MODAL */}
      <AnimatePresence>
      {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedTicket(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative z-10 w-full max-w-sm"
              >
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="absolute -top-12 right-0 md:-right-12 text-zinc-400 hover:text-white transition-colors"
                  >
                      <X size={32} />
                  </button>
                  <DonationTicket request={selectedTicket} />
              </motion.div>
          </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;