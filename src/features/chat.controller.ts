import { Request, Response } from 'express';
import * as chatService from './chat.service'
import asyncHandler from 'express-async-handler';
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
);

export const getConversationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = req.user as IUser;
    const currentUserId = currentUser.id;

    const conversations = await chatService.getConversations(
      currentUserId.toString()
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: conversations,
    });  
  }
);