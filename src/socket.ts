
import { Server } from 'socket.io';

const allowedOrigins = [
  'http://localhost:5173',
  'https://socialsphere-frontend.vercel.app',
  'https://socialsphere-frontend-mu.vercel.app',
  'https://socialsphere-frontend-git-main-shoaib713343s-projects.vercel.app'
];

export const io = new Server({
  // --- THIS IS THE FIX ---
  // We explicitly tell Socket.IO how to handle connections, especially behind a proxy like Render.
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS for Socket.IO'));
      }
    },
    credentials: true,
  },
  // This tells the server to prioritize the WebSocket protocol, which is essential for Render.
  transports: ['websocket', 'polling'],
});
// --- END OF FIX ---
