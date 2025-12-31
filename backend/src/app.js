import express from "express";
import cors from "cors";
import webhookRoutes from "./routes/webhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import donorRoutes from './routes/donorRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import searchRoutes from './routes/searchRoutes.js'; // New
import helmet from "helmet";
import rateLimit from "express-rate-limit"; // Rate limiting
import compression from "compression"; // Gzip compression


const app = express();

app.use(cors());

app.use(
  "/api/webhooks", 
  express.raw({ type: "application/json" }), 
  webhookRoutes
);

// Standard middleware for the rest of the app
app.use(express.json());

// --- Security Middleware ---
app.use(helmet()); 
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10000, // Effectively disabled for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});
// app.use("/api", limiter); // Temporarily commented out to fully unblock
// ---------------------------

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/search', searchRoutes); // New Mount

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Details:", err);
  
  // Default to 500 Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});
// ----------------------------

export default app;