import { Request, Response, NextFunction, RequestHandler } from 'express';

// CatchAsync wrapper function
export const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};