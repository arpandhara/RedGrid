// backend/server.js
import http from 'http'; // Import HTTP module
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/utils/socket.js'; // Import Socket init

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});