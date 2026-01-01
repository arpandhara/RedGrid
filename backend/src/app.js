import express from "express";
import cors from "cors";
import hpp from "hpp"; // Security: Parameter Pollution
import mongoSanitize from "./middlewares/mongoSanitize.js"; // Security (Custom)

import webhookRoutes from "./routes/webhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import donorRoutes from './routes/donorRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import env from "./config/env.js"; // Env Validation

const app = express();

// Security: Trust Proxy (Required for Render/Heroku/Vercel)
app.set('trust proxy', 1);

// Security: Strict CORS
app.use(cors({

  origin: env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// Standard middleware
app.use(express.json());
app.use(mongoSanitize()); // Security: Prevent NoSQL Injection

// --- Security Middleware ---

app.use(helmet());
app.use(compression());
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Security: Rate Limiting (General)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});

// Security: Stricter Rate Limiting (Auth)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later." }
});

app.use("/api/auth", authLimiter);
app.use("/api", limiter);

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