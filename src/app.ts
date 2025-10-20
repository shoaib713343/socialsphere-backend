// src/app.ts
import express from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import errorHandler from './middleware/errorHandler';
import authRoutes from './features/auth.route';
import postRoutes from './features/post.route';
import userRoutes from './features/user.route';
import chatRoutes from './features/chat.route';
import './config/passport';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'https://socialsphere-frontend.vercel.app',
  'https://socialsphere-frontend-git-main-shoaib713343s-projects.vercel.app'
];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// API ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chats', chatRoutes);
app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'UP' }));

// ERROR HANDLING
app.use(errorHandler);

export default app;
