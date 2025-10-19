// src/server.ts
import dotenv from 'dotenv';
import http from 'http';
import app from './app'; // Import the configured app
import { io } from './socket'; // Import the configured io instance
import connectDB from './config/database';
import logger from './utils/logger';

// --- Import all our Socket.IO event handlers ---
import { initializeSocketHandlers } from './features/chat.socket';

dotenv.config();

const PORT = process.env.PORT || 8000;

// 1. Create the HTTP server using our Express app
const httpServer = http.createServer(app);

// 2. Attach the Socket.IO server to our HTTP server
io.attach(httpServer);

// 3. Connect to the database
connectDB();

// 4. Initialize all our Socket.IO event listeners
initializeSocketHandlers(io);

// 5. Start the unified server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server (and Socket.IO) running on http://localhost:${PORT}`);
});