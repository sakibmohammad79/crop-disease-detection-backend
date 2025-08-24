import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendResponse } from '../utils/response';

export const validateRequest = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parseAsync({
        body: req.body,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendResponse(res, {
          statusCode: 400,
          success: false,
          message: error?.message || 'Validation Error',
        });
      }
      next(error);
    }
  };
};