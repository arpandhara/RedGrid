// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import api from '../api/axios'; // Import API helper

const SocketContext = createContext();

// Hook to use the socket anywhere
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Badge Count
  const { user } = useAuthStore(); // Access the logged-in user from your store

  const markRead = () => setUnreadCount(0);

  useEffect(() => {
    // Only connect if we have a user with a MongoDB _id
    if (user && user._id) {
      
      // 1. Initialize Connection
      // Adjust URL if your backend runs on a different port in dev
      // Remove '/api' from the end because Socket.io connects to root
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
      const socketUrl = baseUrl;

      console.log("Initializing socket connection to:", socketUrl, "for user:", user._id);

      // FETCH INITIAL UNREAD COUNT
      const fetchUnreadCount = async () => {
          try {
              const res = await api.get('/notifications/unread-count');
              if (res.data.success) {
                  setUnreadCount(res.data.count);
              }
          } catch (err) {
              console.error("Failed to fetch unread count", err);
          }
      };
      fetchUnreadCount();

      const newSocket = io(socketUrl, {
        transports: ['websocket'], // Force websocket to avoid polling issues
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // 2. Join Personal Room & Setup Listeners when Connected
      newSocket.on('connect', () => {
        console.log("Socket Connected:", newSocket.id);
        newSocket.emit('join', user._id);
      });

      newSocket.on('connect_error', (err) => {
        console.error("Socket Connection Error:", err);
      });

      // 3. Listen for Live Notifications
      newSocket.on('notification', (data) => {
        console.log("New Notification Received:", data);
        setUnreadCount(prev => prev + 1); // Increment Badge
        
        // Generate a unique ID to ensure toast always shows
        const toastId = data.requestId ? `toast-${data.requestId}` : `toast-${Date.now()}`;

        // Show Toast
        toast((t) => (
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="font-bold text-red-500">
              {data.title || (data.type === 'blood_request' ? 'Urgent Blood Request!' : 'Notification')}
            </span>
            <span className="text-sm text-gray-200">
              {typeof data.message === 'string' ? data.message : JSON.stringify(data.message)}
            </span>
            {data.type === 'blood_request' && (
              <button 
                onClick={() => {
                  toast.dismiss(Object.assign(t, { id: toastId }).id); // Ensure dismissal works
                  window.location.href = `/donor/hub`; // Redirect to Hub
                }}
                className="mt-2 bg-red-600 text-white text-xs py-1.5 px-3 rounded-lg hover:bg-red-700 transition w-full font-bold"
              >
                View Request
              </button>
            )}
          </div>
        ), {
          id: toastId, // Force unique ID
          duration: 5000,
          style: {
            background: '#18181b', // Zinc-900
            border: '1px solid #27272a',
            color: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        });
      });

      // Listen for Global Updates (optional, can be handled in components too)
      newSocket.on('request_update', (data) => {
        console.log("Global request update received:", data);
        // We can trigger a global refresh or just let individual components handle it
      });

      setSocket(newSocket);

      // Cleanup on unmount or logout
      return () => {
        console.log("Disconnecting socket...");
        newSocket.disconnect();
      };
    }
  }, [user?._id]); // Only re-run if the User ID changes (Login/Logout), not on profile updates

  return (
    <SocketContext.Provider value={{ socket, unreadCount, markRead }}>
      {children}
    </SocketContext.Provider>
  );
};