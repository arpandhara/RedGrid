// backend/server.js
import http from 'http'; // Import HTTP module
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/utils/socket.js'; // Import Socket init

dotenv.config();

import User from './src/models/User.js'; // Import User model
import Request from './src/models/Request.js'; // Import Request model

// Connect to Database
connectDB().then(async () => {
  try {
    await User.createIndexes();
    await Request.createIndexes();
    console.log("Database Indexes Synced");
  } catch (err) {
    console.error("Index Sync Error:", err);
  }
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});