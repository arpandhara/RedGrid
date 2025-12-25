import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Droplet } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Notifications on Load
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Mark Single as Read
  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update UI optimistically
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

  if (loading) return <div className="p-8 text-zinc-400">Loading alerts...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-500" />
            Notifications
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time alerts about blood needs nearby
          </p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
            <Bell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n._id}
              className={`relative p-5 rounded-xl border transition-all duration-200 ${
                n.isRead 
                  ? 'bg-zinc-900/50 border-zinc-800/50' 
                  : 'bg-zinc-900 border-red-500/30 shadow-lg shadow-red-900/5'
              }`}
            >
              {/* Unread Dot */}
              {!n.isRead && (
                <div className="absolute top-5 right-5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}

              <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                  n.type === 'blood_request' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {n.type === 'blood_request' ? <Droplet className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                  <h4 className={`font-medium mb-1 ${n.isRead ? 'text-zinc-300' : 'text-white'}`}>
                    {n.title}
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                    
                    {!n.isRead && (
                      <button 
                        onClick={() => handleMarkRead(n._id)}
                        className="text-xs text-zinc-500 hover:text-white transition"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;