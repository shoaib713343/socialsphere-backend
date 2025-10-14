import { Request, Response } from 'express';
import * as chatService from './chat.service'
import asyncHandler from "../utils/asyncHandler";
import { IUser } from './auth.model';

export const getChatHistoryHandler = asyncHandler(
  async(req: Request, res: Response) => {
    const user  = req.user as IUser;
    const currentUserId = user._id;
    const { userId: otherUserId } = req.params;
    
    const messages = await chatService.getChatHistory(
        currentUserId.toString(),
        otherUserId
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: messages,
    });
  }
)