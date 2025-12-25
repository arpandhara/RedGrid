import express from "express";
import cors from "cors";
import webhookRoutes from "./routes/webhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

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

export default app;