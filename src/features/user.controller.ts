import { Response, Request } from 'express';
import asyncHandler from 'express-async-handler';
import ApiError from '../utils/ApiError';
import * as authService from './auth.service';
import * as userService from './user.service';
import { IUser, UserModel } from './auth.model';
import { NotificationModel } from './notification.model'; 
import { io } from '../socket'; // 

export const getMeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: user,
    });
  }
);

export const addPhoneHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const {phoneNumber} = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    if(!phoneNumber) {
      throw new ApiError(400, 'Phone number is required');
    }

    const result = await authService.addPhoneAndSendOtp(userId.toString(), phoneNumber);
    res.status(200).json({ success: true, ...result });
  }
)

export const verifyPhoneOtpHandler = asyncHandler(
  async(req: Request, res: Response) => {
    const {otp} = req.body;
    const user = req.user as IUser;
    const userId = user._id;

    const result =  await authService.verifyPhoneOtp(userId.toString(), otp);
    res.status(200).json({ success: true, ...result });
  }
);

export const getAllUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const users = await UserModel.find({ _id: { $ne: user._id } });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: users,
    });
  }
);

export const toggleFollowHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const currentUserId = user._id;
    const { userId: targetUserId } = req.params;

    const result = await authService.toggleFollowUser(
      currentUserId.toString(),
      targetUserId
    );

    // --- NOTIFICATION LOGIC FOR FOLLOW ---
    if (result.message.includes('followed successfully')) {
        // Create Notification
        const notification = await NotificationModel.create({
            recipient: targetUserId,
            sender: currentUserId,
            type: 'follow',
            message: 'started following you',
        });
        // Populate for real-time
        await notification.populate('sender', 'username profilePicture');
        // Emit
        io.to(targetUserId).emit('newNotification', notification);
    }
    // -------------------------------------

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
    });
  }
);

export const getUserProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;
    const user = await userService.getUserByUsername(username);
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: user,
    });
  }
);

export const updateUserProfilePictureHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'Avatar image is required');
    }
    const user = req.user as IUser;
    const updatedUser = await userService.updateUserProfilePicture(user._id.toString(), req.file);
    
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile picture updated successfully',
      data: updatedUser,
    });
  }
);

// --- NEW NOTIFICATION HANDLERS ---

export const getNotificationsHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;
        const notifications = await userService.getUserNotifications(user._id.toString());
        res.status(200).json({
            success: true,
            statusCode: 200,
            data: notifications
        });
    }
);

export const markNotificationsReadHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;
        await userService.markNotificationsRead(user._id.toString());
        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Marked as read'
        });
    }
);