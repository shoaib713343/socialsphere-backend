import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import logger from "../utils/logger";

const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'An unexpected error occured';
    let errors: string[] = [];

    if(err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors
    } else {
        logger.error(err);
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors
    });
};

export default errorHandler;