// backend/src/utils/socket.js
import { Server } from "socket.io";
import env from "../config/env.js";

let io;

export const initSocket = (httpServer) => {
  const allowedOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(",").map(url => url.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some(allowed =>
          origin === allowed || origin.includes('.vercel.app')
        );
        if (isAllowed) return callback(null, true);
        console.warn("Socket CORS blocked:", origin);
        return callback(null, true); 
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Increased timeouts for better stability
    pingTimeout: 60000, // Wait 60s before assuming dead
    pingInterval: 25000, // Ping every 25s
    transports: ['websocket', 'polling']
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`User ${userId} joined room.`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id} Reason: ${reason}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};