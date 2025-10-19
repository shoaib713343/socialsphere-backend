// src/features/auth.controller.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as authService from './auth.service';
import { IUser } from './auth.model';
import crypto from 'crypto';
import ApiError from '../utils/ApiError';

export const registerUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const newUser = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Registration successful. Please check your email to verify your account.',
      data: newUser,
    });
  }
);

export const loginUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
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
        data: { user, accessToken },
      });
  }
);

export const refreshAccessTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, 'Unauthorized: No refresh token provided');
    }
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
    await authService.logoutUser(user._id.toString());

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

export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      throw new ApiError(400, 'Verification token is missing');
    }
    
    const { user, accessToken, refreshToken } = await authService.verifyEmail(token);
    
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = hashedRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Redirect to the frontend's login success page with the new accessToken
    res.redirect(`http://localhost:5173/login-success?token=${accessToken}`);
  }
);

export const loginSuccessHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { accessToken, refreshToken } = await authService.generateAccessAndRefreshTokens(user._id.toString());
    
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = hashedRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.redirect(`http://localhost:5173/login-success?token=${accessToken}`);
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

export const resendVerificationEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as IUser)._id;
    const result = await authService.resendVerificationEmail(userId.toString());
    res.status(200).json({ success: true, ...result });
  }
);