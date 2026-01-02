// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthStore();
  const socketRef = useRef(null);

  const markRead = () => setUnreadCount(0);

  const showNotificationToast = (data) => {
    const toastId = `notification-${data.requestId || 'gen'}-${Date.now()}`;
    
    toast((t) => (
      <div className="flex flex-col gap-1 min-w-[200px]">
        <span className="font-bold text-red-500">
          {data.title || 'Notification'}
        </span>
        <span className="text-sm text-gray-200">
          {typeof data.message === 'string' ? data.message : JSON.stringify(data.message)}
        </span>
        {data.type === 'blood_request' && (
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = `/donor/hub`;
            }}
            className="mt-2 bg-red-600 text-white text-xs py-1.5 px-3 rounded-lg hover:bg-red-700 transition w-full font-bold"
          >
            View Request
          </button>
        )}
      </div>
    ), {
      id: toastId,
      duration: 6000, 
      style: {
        background: '#18181b',
        border: '1px solid #27272a',
        color: '#fff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    });
  };

  useEffect(() => {
    if (user && user._id) {
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

      console.log("Initializing socket connection to:", baseUrl);

      // 1. Sync Unread Count (Initial & Reconnect)
      const syncNotifications = async () => {
        try {
          const res = await api.get('/notifications/unread-count');
          if (res.data.success) {
            setUnreadCount(res.data.count);
          }
        } catch (err) {
          console.error("Failed to sync notifications", err);
        }
      };

      syncNotifications();

      // 2. Initialize Socket with Stable Settings
      const newSocket = io(baseUrl, {
        transports: ['websocket', 'polling'], // WebSocket preferred, polling as fallback
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
      });

      socketRef.current = newSocket;

      // --- EVENT LISTENERS ---

      newSocket.on('connect', () => {
        console.log("✅ Socket Connected:", newSocket.id);
        // Join the user's personal room immediately
        newSocket.emit('join', user._id);
        syncNotifications(); 
      });

      newSocket.on('reconnect', (attempt) => {
        console.log(`🔄 Socket reconnected after attempt ${attempt}`);
        newSocket.emit('join', user._id);
        syncNotifications();
      });

      newSocket.on('disconnect', (reason) => {
        console.warn("⚠️ Socket Disconnected:", reason);
        if (reason === 'io server disconnect') {
          // Server booted us, try to reconnect manually
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error("❌ Socket Connection Error:", err.message);
      });

      // --- NOTIFICATION HANDLER ---
      newSocket.on('notification', (data) => {
        console.log("🔔 Notification Received:", data);
        setUnreadCount(prev => prev + 1);
        showNotificationToast(data);
      });

      newSocket.on('request_update', (data) => {
        console.log("📡 Request Update Broadcast:", data);
      });

      setSocket(newSocket);

      return () => {
        console.log("Cleaning up socket...");
        newSocket.disconnect();
        socketRef.current = null;
      };
    }
  }, [user?._id]); // Only re-run if USER changes, not on every render

  return (
    <SocketContext.Provider value={{ socket, unreadCount, markRead }}>
      {children}
    </SocketContext.Provider>
  );
};