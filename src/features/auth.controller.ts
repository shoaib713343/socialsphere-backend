import { Request, Response} from 'express';
import * as authService from './auth.service';
import asyncHandler from '../utils/asyncHandler';
import { success } from 'zod';
import ApiError from '../utils/ApiError';
import { IUser } from './auth.model';
import crypto from 'crypto'

export const registerUserHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const newUser = await authService.registerUser(req.body);

        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'User registered successfully',
            data: newUser, 
        });
    }
);

export const loginUserHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await authService.loginUser(req.body);

        const cookieOptions = {
            httpOnly : true,
            secure: process.env.NODE_ENV === 'production',
        };

        res
            .status(200)
      .cookie('refreshToken', result.refreshToken, cookieOptions)
      .json({
        success: true,
        statusCode: 200,
        message: 'User logged in successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    }
)

export const refreshAccessTokenHandler = asyncHandler(
    async (req: Request, res: Response) => {
       // console.log('Cookies received by server:', req.cookies);
        const incomingRefreshToken = req.cookies.refreshToken;

        const { accessToken } = await authService.refreshAccessToken(incomingRefreshToken);
         res.status(200).json({
      success: true,
      statusCode: 200,
      data: { accessToken },
   });
}
);

export const logoutUserHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const user = req.user as IUser;
        await authService.logoutUser(user!.id);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        };
        res
      .status(200)
      .clearCookie('refreshToken', cookieOptions)
      .json({
        success: true,
        statusCode: 200,
        message: 'User logged out successfully',
      });


    }
);

export const toggleFollowHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const currentUserId = user._id;
    const { userId: targetUserId } = req.params;

    const result = await authService.toggleFollowUser(currentUserId.toString(), targetUserId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message
    })
  }
);

export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if(!token) {
      throw new ApiError(400, 'Verification token is missing');
    }

    await authService.verifyEmail(token);

     res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Email verified successfully. You can now log in.',
    });
  }
);

export const loginSuccessHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { accessToken, refreshToken } = authService.generateAccessAndRefreshTokens(user._id.toString());
    
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = hashedRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
    };
    res
      .status(200)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json({
        success: true,
        statusCode: 200,
        message: 'User logged in successfully',
        data: {
          accessToken,
          user,
        },
      });

  }
);

export const forgotPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
  }
);

export const resetPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password has been reset successfully.',
    });
  }
);

