import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

const app = express();

app.use(cors());
app.use(helmet());
app.use(mongoSanitize());

// 2. Standard Parsers
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- Routes ---


// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

export default app;