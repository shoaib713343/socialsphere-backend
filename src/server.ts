import dotenv from 'dotenv';
import app from './app'; // Import the configured app
import { httpServer, initializeSocketIO } from './socket';
import connectDB from './config/database';
import logger from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect to Database
connectDB();

// Initialize Socket.IO and pass the express app to it
initializeSocketIO(app);

// Start the server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server (and Socket.IO) running on http://localhost:${PORT}`);
});