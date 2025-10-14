
import { Response, Request } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import * as authService from './auth.service';
import { IUser } from './auth.model';

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
