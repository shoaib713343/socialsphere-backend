// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import ApiError from '../utils/ApiError';
import { UserModel } from '../features/auth.model';
import asyncHandler from 'express-async-handler';

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
     token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, 'Unauthorized: You are not logged in.');
    }

    try {
      // 1. Verify the token
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as { _id: string };
      
      // 2. Find the user based on the token
      const currentUser = await UserModel.findById(decoded._id);

      if (!currentUser) {
        throw new ApiError(401, 'Unauthorized: The user for this token no longer exists.');
      }

      // 3. 
      // Check if the user has verified their email
      if (!currentUser.isEmailVerified) {
        const allowedPaths = [
          '/api/v1/auth/resend-verification',
          '/api/v1/auth/logout' 
        ];
       if (!allowedPaths.includes(req.originalUrl)) {
          throw new ApiError(403, 'Forbidden: Please verify your email to perform this action.');
        }
      }
      
      // 4. Attach the user to the request object for future use
      req.user = currentUser;
      next();
    } catch (error) {
      // This block gracefully handles errors like "TokenExpiredError"
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Unauthorized: Invalid or expired token.');
      }
      // Forward any other unexpected errors
      throw error;
    }
  }
);