// src/features/chat.socket.ts
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { IUser } from './auth.model';
import logger from '../utils/logger';
import { saveChatMessage } from './chat.service';

interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

const onlineUsers = new Map<string, { socketId: string; username: string }>();

export const initializeSocketHandlers = (io: Server) => {
  // Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      socket.user = jwt.verify(token, config.jwt.accessTokenSecret) as IUser;
      next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  // Connection Handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.user?._id) return;
    const { _id: userId, username } = socket.user;
    const userIdStr = userId.toString();

    logger.info(`New client connected: ${socket.id}, User: ${username} (${userIdStr})`);
    
    onlineUsers.set(userIdStr, { socketId: socket.id, username });
    socket.broadcast.emit('user_online', { userId: userIdStr, username });
    socket.emit('online_users', Array.from(onlineUsers.entries()).map(([id, data]) => ({ userId: id, ...data })));
    socket.join(userIdStr);

    // Event Handlers for this specific user
    socket.on('sendMessage', async (data: { receiverId: string; content: string }) => {
       if (!socket.user?._id) return;
       const message = await saveChatMessage({ senderId: socket.user._id.toString(), receiverId: data.receiverId, content: data.content });
       io.to(data.receiverId).emit('receiveMessage', message);
    });
    
    socket.on('start_typing', (data) => io.to(data.receiverId).emit('user_typing_start', { senderId: userIdStr }));
    socket.on('stop_typing', (data) => io.to(data.receiverId).emit('user_typing_stop', { senderId: userIdStr }));

    // Disconnect Handler
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}, User: ${username} (${userIdStr})`);
      onlineUsers.delete(userIdStr);
      io.emit('user_offline', { userId: userIdStr, username });
    });
  });
};