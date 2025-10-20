// src/socket.ts
import { Server } from 'socket.io';
import { CorsOptions } from 'cors';

// --- THIS IS THE FIX ---
// We create the same "allowed list" that we have in app.ts
const allowedOrigins = [
  'http://localhost:5173', // For local development
  'https://socialsphere-frontend.vercel.app',
  'https://socialsphere-frontend-git-main-shoaib713343s-projects.vercel.app'
  // Add any other Vercel preview URLs if needed
];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
};

export const io = new Server({
  cors: corsOptions, // Use the new, smarter CORS options
});
// --- END OF FIX ---
