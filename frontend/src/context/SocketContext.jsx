// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

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
      const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000"); 

      // 2. Join Personal Room
      // The backend expects: socket.on('join', (userId) => ... )
      newSocket.emit('join', user._id);

      // 3. Listen for Live Notifications
      newSocket.on('notification', (data) => {
        console.log("New Notification Received:", data);
        setUnreadCount(prev => prev + 1); // Increment Badge
        
        toast((t) => (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-red-500">
              {data.type === 'blood_request' ? 'Urgent Blood Request!' : 'Notification'}
            </span>
            <span className="text-sm text-gray-200">
              {data.message}
            </span>
            {data.type === 'blood_request' && (
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  // Future: Navigate to request details page
                  window.location.href = `/requests/${data.requestId}`; 
                }}
                className="mt-2 bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 transition"
              >
                View Details
              </button>
            )}
          </div>
        ), {
          duration: 5000,
          style: {
            background: '#18181b', // Zinc-900
            border: '1px solid #27272a',
            color: '#fff',
          }
        });
      });

      setSocket(newSocket);

      // Cleanup on unmount or logout
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]); // Re-run if user logs in/out

  return (
    <SocketContext.Provider value={{ socket, unreadCount, markRead }}>
      {children}
    </SocketContext.Provider>
  );
};