import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './config/passport'
import cors, { CorsOptions } from 'cors';

import authRouter from './features/auth.route';
import userRouter from './features/user.route';
import postRouter from './features/post.route';
import chatRouter from './features/chat.route';
import errorHandler from './middleware/errorHandler';

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // For local development
  'https://socialsphere-frontend-mu.vercel.app' // Your live frontend URL
];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/chats', chatRouter);


app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'UP' }));

app.use(errorHandler);

export default app;

