import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { UserModel, IUser } from '../features/auth.model';



export const protect = asyncHandler(
    async(req: Request, res: Response, next: NextFunction) => {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        if(!token){
            throw new ApiError(401, 'Not authorized, no token');
        }
        const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as { _id: string};

        const currentUser = await UserModel.findById(decoded._id);

        if (!currentUser) {
      throw new ApiError(401, 'Not authorized, user not found');
        }
        req.user = currentUser;
        next();
    }
)