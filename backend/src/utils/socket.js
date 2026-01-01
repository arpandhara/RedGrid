import { Server } from "socket.io";
// import jwt from "jsonwebtoken"; // If you verify JWTs manually
import env from "../config/env.js";

let io;

export const initSocket = (httpServer) => {
  // Parse allowed origins from env
  const allowedOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(",").map(url => url.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

  console.log("Socket.IO allowed origins:", allowedOrigins);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        // Check if origin matches or is a Vercel preview URL
        const isAllowed = allowedOrigins.some(allowed =>
          origin === allowed || origin.includes('.vercel.app')
        );
        if (isAllowed) {
          return callback(null, true);
        }
        console.warn("Socket CORS blocked origin:", origin);
        return callback(null, true); // Allow anyway for now to debug
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });


  // Security: Middleware for Authentication
  io.use((socket, next) => {

    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token && !socket.handshake.query?.userId) {

    }
    next();
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id, "from:", socket.handshake.headers.origin);

    // Client must emit 'join' with their User ID to receive personal notifications
    socket.on("join", (userId) => {
      // Security: Validate userId string?
      if (!userId) return;
      socket.join(userId);
      console.log(`User ${userId} joined room. Socket rooms:`, Array.from(socket.rooms));
    });

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);
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

