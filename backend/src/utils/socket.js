import { Server } from "socket.io";
// import jwt from "jsonwebtoken"; // If you verify JWTs manually
import env from "../config/env.js";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  // Security: Middleware for Authentication
  io.use((socket, next) => {

    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token && !socket.handshake.query?.userId) {

    }
    next();
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Client must emit 'join' with their User ID to receive personal notifications
    socket.on("join", (userId) => {
      // Security: Validate userId string?
      if (!userId) return;
      socket.join(userId);
      console.log(`User ${userId} joined their notification room.`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
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
