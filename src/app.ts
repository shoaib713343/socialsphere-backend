import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './config/passport'

import authRouter from './features/auth.route';
import userRouter from './features/user.route';
import postRouter from './features/post.route';
import chatRouter from './features/chat.route';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(cors());
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

