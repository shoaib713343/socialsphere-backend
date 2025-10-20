import dotenv from 'dotenv';
import http from 'http';
import app from './app';
import { io } from './socket';
import connectDB from './config/database';
import logger from './utils/logger';
import { initializeSocketHandlers } from './features/chat.socket';

dotenv.config();

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);
io.attach(httpServer);
connectDB();
initializeSocketHandlers(io);

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  const serverUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  logger.info(`🚀 Server (and Socket.IO) running on ${serverUrl}`);
});
