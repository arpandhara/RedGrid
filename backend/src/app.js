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

const app = express();

app.use(cors());

app.use(
  "/api/webhooks", 
  express.raw({ type: "application/json" }), 
  webhookRoutes
);

// Standard middleware for the rest of the app
app.use(express.json());

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

export default app;