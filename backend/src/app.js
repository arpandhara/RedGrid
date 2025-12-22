import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

// Route Imports
import webhookRoutes from './routes/webhookRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// --- Global Security Middleware ---
app.use(cors());
app.use(helmet());
app.use(mongoSanitize());


app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);


app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ---  API Routes ---
app.use('/api/auth', authRoutes);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

export default app;