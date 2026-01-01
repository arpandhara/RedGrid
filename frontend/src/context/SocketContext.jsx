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

  // Toast display helper (defined outside useEffect for reuse)
  const showNotificationToast = (data) => {
    const toastId = data.requestId || data._id || `toast-${Date.now()}`;
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
      duration: 8000, // Longer duration
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

      console.log("Initializing socket connection to:", baseUrl, "for user:", user._id);

      // Fetch initial unread count
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

      // Create socket with aggressive keep-alive settings
      const newSocket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity, // Never stop trying
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        timeout: 10000,
        forceNew: false,
        autoConnect: true,
      });

      socketRef.current = newSocket;

      // Connection established
      newSocket.on('connect', () => {
        console.log("✅ Socket Connected:", newSocket.id);
        newSocket.emit('join', user._id);
      });

      // Socket.IO manager level reconnect
      newSocket.io.on('reconnect', (attempt) => {
        console.log(`🔄 Socket.IO Manager reconnected after ${attempt} attempts`);
        newSocket.emit('join', user._id);
        fetchUnreadCount(); // Refresh count on reconnect
      });

      // Socket level reconnect
      newSocket.on('reconnect', () => {
        console.log("🔄 Socket reconnected, rejoining room:", user._id);
        newSocket.emit('join', user._id);
      });

      newSocket.on('connect_error', (err) => {
        console.error("❌ Socket Connection Error:", err.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn("⚠️ Socket Disconnected:", reason);
        // If server disconnected us, reconnect manually
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      // MAIN: Listen for notifications
      newSocket.on('notification', (data) => {
        const receivedTime = new Date().toISOString();
        console.log(`🔔 [${receivedTime}] New Notification Received:`, data);
        
        // Play sound
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple beep
            audio.play().catch(e => console.log('Audio blocked:', e));
        } catch (e) {
            // Ignore audio errors
        }

        setUnreadCount(prev => prev + 1);
        showNotificationToast(data);
      });

      // Global updates
      newSocket.on('request_update', (data) => {
        console.log("📡 Global request update:", data);
      });

      setSocket(newSocket);

      // Cleanup
      return () => {
        console.log("Disconnecting socket...");
        newSocket.disconnect();
        socketRef.current = null;
      };
    }
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, markRead }}>
      {children}
    </SocketContext.Provider>
  );
};