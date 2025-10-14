import { Server, Socket } from "socket.io";
import http from 'http';
import { Application } from "express";
import logger from "./utils/logger";
import { IUser } from "./features/auth.model";
import jwt from 'jsonwebtoken';
import config from "./config";
import { saveChatMessage } from "./features/chat.service";

interface AuthenticatedSocket extends Socket {
  user? : IUser;
}

const onlineUsers = new Map<string, { socketId: string; username: string} > ();

export const httpServer = http.createServer();
export const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST'],
    },
});

export const initializeSocketIO = (app: Application) => {
    httpServer.on('request', app);

    io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;

      if(!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as IUser;

        socket.user = decoded;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

     io.on('connection', (socket: AuthenticatedSocket) => {
   
    if(!socket.user?._id) return;

    const userId = socket.user._id.toString();
    const username = socket.user.username;
    logger.info(`New client connected: ${socket.id}, User: ${username} (${userId})`);

    onlineUsers.set(userId, { socketId: socket.id, username });

    socket.broadcast.emit('user_online', {userId, username});

    socket.emit('online_user', Array.from(onlineUsers.entries()).map(([id, data]) => ({userId:id, ...data})));

    socket.join(userId);

    socket.on('sendMessage', async (data: {receiverId: string; content: string}) => {
      if(!socket.user?._id) return;

      try{
        const message = await saveChatMessage({
          senderId: socket.user._id.toString(),
          receiverId: data.receiverId,
          content: data.content,
        });

        io.to(data.receiverId).emit('recieveMessage', message);
      } catch(error) {
        logger.error('Error handling sendMessage:', error);
      }
    });

      socket.on('start_typing', (data: { receiverId: string }) => {
    if (!socket.user?._id) return;
    io.to(data.receiverId).emit('user_typing_start', { senderId: socket.user._id });
  });

   socket.on('stop_typing', (data: { receiverId: string }) => {
    if (!socket.user?._id) return;
    io.to(data.receiverId).emit('user_typing_stop', { senderId: socket.user._id });
  });

     socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId, username });
    });
    });

};