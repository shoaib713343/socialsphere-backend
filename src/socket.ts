// src/socket.ts
import { Server } from 'socket.io';

export const io = new Server({
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});