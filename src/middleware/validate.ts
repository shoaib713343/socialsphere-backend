// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import ApiError from '../utils/ApiError';

const validate =
  (schema: z.Schema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => issue.message);
        next(new ApiError(400, 'Validation failed', errorMessages));
      } else {
        next(new ApiError(500, 'An unexpected validation error occurred'));
      }
    }
  };

export default validate;